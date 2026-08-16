import { spawn } from 'node:child_process';
import { closeSync, openSync } from 'node:fs';
import { appendFile, chmod, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';
import { connect } from 'node:net';
import { isAbsolute, join, resolve } from 'node:path';
const REPOSITORY_URL = 'https://github.com/HeWhenJay/Multimodal-RAG-Agent-Learning-Evidence-Platform.git';
const CONTAINER_NAME = 'dsh-knowledge-pgvector';
const VOLUME_NAME = 'dsh-knowledge-pgvector-data';
const SERVICE_URL = 'http://127.0.0.1:8090';
const DEFAULT_DEPENDENCIES = {
    commandAvailable,
    serviceReady: ownedServiceReady,
};
/** 管理零登录项目 RAG 的新手一键准备流程；失败不影响 local 模式。 */
export class KnowledgeSetupService {
    home;
    onReady;
    dependencies;
    status;
    task;
    constructor(home = process.env.DSH_HOME || join(homedir(), '.dsh'), onReady, dependencies = DEFAULT_DEPENDENCIES) {
        this.home = home;
        this.onReady = onReady;
        this.dependencies = dependencies;
        this.status = this.initialStatus();
    }
    defaultInstallRoot() { return join(this.home, 'project-knowledge-review', 'full-rag'); }
    /** 返回环境与服务状态，不泄露数据库密码。 */
    async describe() {
        if (!this.task) {
            const persisted = await this.readPersistedStatus();
            if (persisted)
                this.status = persisted;
            if (persisted?.phase === 'ready' && await this.dependencies.serviceReady(persisted.installRoot)) {
                this.status = { ...this.status, phase: 'ready', running: false, message: '完整多模态服务已就绪', updatedAt: new Date().toISOString() };
            }
            else {
                this.status = {
                    ...this.status,
                    ...(persisted?.phase === 'ready' ? { phase: 'idle', running: false, message: '完整环境已安装，但服务当前未运行；可点击一键准备安全恢复。' } : {}),
                    prerequisites: await this.inspectPrerequisites(),
                    updatedAt: new Date().toISOString(),
                };
            }
        }
        return this.status;
    }
    /** 只执行版本/服务探测，不下载、不安装、不修改系统。 */
    async inspectPrerequisites() {
        const available = async (command, args) => {
            try {
                return await this.dependencies.commandAvailable(command, args);
            }
            catch {
                return false;
            }
        };
        const [docker, git, conda] = await Promise.all([
            available('docker', ['info', '--format', '{{.ServerVersion}}']),
            available('git', ['--version']),
            available('conda', ['--version']),
        ]);
        return { docker, git, conda };
    }
    /** 启动幂等后台准备任务；同一时间只允许一个任务。 */
    start(installRoot, ragApiKey) {
        if (this.task)
            return this.status;
        if (!ragApiKey?.trim())
            throw new Error('完整多模态需要模型 API Key；请先在当前页面填写，Key 只保存到 DSH 凭据库');
        const root = validateInstallRoot(installRoot || this.defaultInstallRoot());
        this.status = { ...this.initialStatus(), phase: 'checking', running: true, message: '正在检查本机环境…', installRoot: root, updatedAt: new Date().toISOString() };
        this.task = this.run(root, ragApiKey).finally(() => { this.task = undefined; });
        return this.status;
    }
    initialStatus() {
        return { phase: 'idle', running: false, message: '本地开箱即用模式已可用；完整多模态为可选增强。', installRoot: this.defaultInstallRoot(), serviceUrl: SERVICE_URL, prerequisites: { docker: false, git: false, conda: false }, updatedAt: new Date().toISOString() };
    }
    async run(root, ragApiKey) {
        try {
            await mkdir(root, { recursive: true });
            const prerequisites = await this.inspectPrerequisites();
            this.status.prerequisites = prerequisites;
            await this.update('checking', '环境检查完成');
            const missing = Object.entries(prerequisites).filter(([, ready]) => !ready).map(([name]) => name);
            if (missing.length)
                throw new Error(`缺少系统前提：${missing.join('、')}。本地开箱即用模式仍可正常使用。`);
            if (await this.dependencies.serviceReady(root)) {
                await this.onReady?.();
                await this.update('ready', '完整多模态服务已就绪，已安全复用现有服务。', false);
                return;
            }
            const repository = join(root, 'project');
            if (!(await exists(join(repository, 'ai-python', 'run.py')))) {
                if (await exists(repository))
                    throw new Error('目标项目目录已存在但不是有效项目；请选择空目录');
                await this.update('cloning', '正在下载完整多模态项目…');
                await runCommand('git', ['clone', '--depth', '1', REPOSITORY_URL, repository], root, this.logPath(root));
            }
            await this.update('database', '正在准备 PostgreSQL/pgvector 数据库…');
            const secrets = await this.loadOrCreateSecrets(root);
            if (!(await dockerContainerExists()) && await portListening(5433))
                throw new Error('端口 5433 已被其他数据库或程序占用；未自动关闭或替换该服务');
            const databaseUrl = `postgresql://postgres:${encodeURIComponent(secrets.databasePassword)}@127.0.0.1:5433/postgres?options=-csearch_path%3Dlearning_evidence%2Cpublic`;
            if (!(await dockerContainerExists())) {
                await runCommand('docker', [
                    'run', '-d', '--name', CONTAINER_NAME, '--label', 'dsh.project-knowledge-review.managed=true', '--restart', 'unless-stopped',
                    '-e', `POSTGRES_PASSWORD=${secrets.databasePassword}`,
                    '-p', '127.0.0.1:5433:5432', '-v', `${VOLUME_NAME}:/var/lib/postgresql/data`,
                    'pgvector/pgvector:pg16',
                ], root, this.logPath(root));
            }
            else {
                if (!(await dockerContainerOwned()))
                    throw new Error(`容器 ${CONTAINER_NAME} 已存在但不属于本插件，已停止以避免误操作`);
                await runCommand('docker', ['start', CONTAINER_NAME], root, this.logPath(root));
            }
            await waitForCommand('docker', ['exec', CONTAINER_NAME, 'pg_isready', '-U', 'postgres'], root, this.logPath(root), 60);
            await this.update('environment', '正在准备 Python 多模态环境（首次可能需要数分钟）…');
            const environmentFile = join(repository, 'ai-python', 'environment.yml');
            const environmentPrefix = join(root, 'conda-env');
            const envExists = await exists(join(environmentPrefix, 'conda-meta'));
            await runCommand('conda', envExists
                ? ['env', 'update', '-p', environmentPrefix, '-f', environmentFile, '--prune']
                : ['env', 'create', '-p', environmentPrefix, '-f', environmentFile], repository, this.logPath(root));
            await this.update('starting', '正在初始化数据库并启动完整多模态服务…');
            if (await ownedServiceReady(root)) {
                await this.onReady?.();
                await this.update('ready', '完整多模态服务已就绪，已安全复用现有服务。', false);
                return;
            }
            if (await serviceHealthy())
                throw new Error('端口 8090 已被其他服务占用；未自动关闭或替换该进程');
            const serviceLog = this.serviceLogPath(root);
            const serviceEnv = {
                ...process.env,
                PYTHONPATH: join(repository, 'ai-python'),
                RAG_DATABASE_URL: databaseUrl,
                AUTH_DATABASE_URL: databaseUrl,
                RAG_STORE_BACKEND: 'pgvector',
                RAG_KAFKA_ENABLED: 'false',
                AI_KAFKA_WORKER_ENABLED: 'false',
                RAG_DSH_PLUGIN_ENABLED: 'true',
                DSH_PLUGIN_RAG_USER_ID: 'dsh-plugin',
                EVIDENCE_UPLOAD_ROOT: join(root, 'uploads'),
                ...(ragApiKey?.trim() ? { DASHSCOPE_API_KEY: ragApiKey.trim() } : {}),
            };
            await writePrivateJson(join(root, 'setup-config.json'), { managedBy: 'dsh-project-knowledge-review', repository, environmentPrefix, databaseUrl: databaseUrl.replace(secrets.databasePassword, '***'), serviceUrl: SERVICE_URL });
            await spawnDetached('conda', ['run', '--no-capture-output', '-p', environmentPrefix, 'python', '-B', join(repository, 'ai-python', 'run.py'), '--bootstrap-database', '--without-kafka'], repository, serviceEnv, serviceLog);
            await waitForHealth(300);
            await waitForRagOverview(60);
            await this.onReady?.();
            await this.update('ready', '完整多模态服务已就绪', false);
        }
        catch (error) {
            await this.update('failed', '完整多模态准备未完成；本地开箱即用模式仍可正常使用。', false, messageOf(error));
        }
    }
    statusPath(root = this.status.installRoot) { return join(root, 'setup-status.json'); }
    logPath(root) { return join(root, 'setup.log'); }
    serviceLogPath(root) { return join(root, 'service.log'); }
    async update(phase, message, running = true, error) {
        this.status = { ...this.status, phase, running, message, updatedAt: new Date().toISOString(), ...(error ? { error } : {}) };
        await mkdir(this.status.installRoot, { recursive: true });
        await writePrivateJson(this.statusPath(), this.status);
        await writePrivateJson(join(this.home, 'project-knowledge-review', 'setup-pointer.json'), { installRoot: this.status.installRoot });
    }
    async readPersistedStatus() {
        for (const path of [join(this.home, 'project-knowledge-review', 'setup-pointer.json'), this.statusPath(this.defaultInstallRoot())]) {
            try {
                const value = JSON.parse(await readFile(path, 'utf8'));
                if (!('phase' in value) && !value.installRoot)
                    continue;
                const target = 'phase' in value ? value : JSON.parse(await readFile(this.statusPath(value.installRoot), 'utf8'));
                if (target.installRoot)
                    return target;
            }
            catch { /* 尚未运行过一键准备。 */ }
        }
        return undefined;
    }
    async loadOrCreateSecrets(root) {
        const path = join(root, 'setup-secrets.json');
        try {
            return JSON.parse(await readFile(path, 'utf8'));
        }
        catch {
            const value = { databasePassword: randomBytes(24).toString('base64url') };
            await writePrivateJson(path, value);
            return value;
        }
    }
}
function validateInstallRoot(value) {
    const root = resolve(value.trim());
    if (!value.trim() || !isAbsolute(root))
        throw new Error('安装目录必须是本机绝对路径');
    return root;
}
async function exists(path) { try {
    await stat(path);
    return true;
}
catch {
    return false;
} }
async function portListening(port) {
    return new Promise((resolvePromise) => {
        const socket = connect({ host: '127.0.0.1', port });
        const finish = (value) => { socket.destroy(); resolvePromise(value); };
        socket.setTimeout(800);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));
    });
}
async function commandAvailable(command, args) { try {
    await runCommand(command, args, process.cwd(), undefined);
    return true;
}
catch {
    return false;
} }
async function spawnDetached(command, args, cwd, env, logPath) {
    const output = openSync(logPath, 'a');
    try {
        await new Promise((resolvePromise, rejectPromise) => {
            const child = spawn(command, args, { cwd, env, detached: true, windowsHide: true, stdio: ['ignore', output, output] });
            child.once('error', rejectPromise);
            child.once('spawn', () => { child.unref(); resolvePromise(); });
        });
    }
    finally {
        closeSync(output);
    }
}
async function runCommand(command, args, cwd, logPath, tolerateFailure = false) {
    await new Promise((resolvePromise, rejectPromise) => {
        const child = spawn(command, args, { cwd, windowsHide: true, shell: false, env: process.env });
        let output = '';
        child.stdout?.on('data', (chunk) => { output = bounded(output + String(chunk)); if (logPath)
            void appendFile(logPath, chunk); });
        child.stderr?.on('data', (chunk) => { output = bounded(output + String(chunk)); if (logPath)
            void appendFile(logPath, chunk); });
        child.once('error', rejectPromise);
        child.once('close', (code) => code === 0 || tolerateFailure ? resolvePromise() : rejectPromise(new Error(`${command} 执行失败（${code ?? 'unknown'}）：${output.trim()}`)));
    });
}
async function waitForCommand(command, args, cwd, logPath, attempts) {
    for (let index = 0; index < attempts; index += 1) {
        try {
            await runCommand(command, args, cwd, logPath);
            return;
        }
        catch {
            await delay(1000);
        }
    }
    throw new Error('数据库启动超时');
}
async function dockerContainerExists() { try {
    await runCommand('docker', ['inspect', CONTAINER_NAME], process.cwd());
    return true;
}
catch {
    return false;
} }
async function dockerContainerOwned() { try {
    return (await captureCommand('docker', ['inspect', '--format', '{{ index .Config.Labels "dsh.project-knowledge-review.managed" }}', CONTAINER_NAME])).trim() === 'true';
}
catch {
    return false;
} }
async function captureCommand(command, args) {
    return new Promise((resolvePromise, rejectPromise) => {
        const child = spawn(command, args, { windowsHide: true, shell: false });
        let output = '';
        child.stdout.on('data', (chunk) => { output += String(chunk); });
        child.stderr.on('data', (chunk) => { output += String(chunk); });
        child.once('error', rejectPromise);
        child.once('close', (code) => code === 0 ? resolvePromise(output) : rejectPromise(new Error(output)));
    });
}
async function serviceHealthy() { try {
    const response = await fetch(`${SERVICE_URL}/health`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
}
catch {
    return false;
} }
async function ragOverviewHealthy() { try {
    const response = await fetch(`${SERVICE_URL}/api/dsh-plugin/rag/overview`, { signal: AbortSignal.timeout(2000) });
    return response.ok;
}
catch {
    return false;
} }
async function ownedServiceReady(root) {
    try {
        const config = JSON.parse(await readFile(join(root, 'setup-config.json'), 'utf8'));
        return config.managedBy === 'dsh-project-knowledge-review' && config.serviceUrl === SERVICE_URL && await serviceHealthy() && await ragOverviewHealthy();
    }
    catch {
        return false;
    }
}
async function waitForHealth(seconds) { for (let index = 0; index < seconds; index += 1) {
    if (await serviceHealthy())
        return;
    await delay(1000);
} throw new Error('完整多模态服务启动超时，请查看 service.log'); }
async function waitForRagOverview(seconds) { for (let index = 0; index < seconds; index += 1) {
    if (await ragOverviewHealthy())
        return;
    await delay(1000);
} throw new Error('服务健康，但 DSH 知识分区未就绪，请查看 service.log'); }
async function writePrivateJson(path, value) { await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 }); try {
    await chmod(path, 0o600);
}
catch { /* Windows ACL 由用户目录继承。 */ } }
function bounded(value) { return value.length > 12000 ? value.slice(-12000) : value; }
function delay(ms) { return new Promise((resolvePromise) => setTimeout(resolvePromise, ms)); }
function messageOf(error) { return error instanceof Error ? error.message : '未知错误'; }
