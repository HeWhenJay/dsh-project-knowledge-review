export type SetupPhase = 'idle' | 'checking' | 'cloning' | 'database' | 'environment' | 'starting' | 'ready' | 'failed';
export interface SetupStatus {
    phase: SetupPhase;
    running: boolean;
    message: string;
    installRoot: string;
    serviceUrl: string;
    prerequisites: {
        docker: boolean;
        git: boolean;
        conda: boolean;
    };
    updatedAt: string;
    error?: string;
}
export interface SetupDependencies {
    commandAvailable: (command: string, args: string[]) => Promise<boolean>;
    serviceReady: (root: string) => Promise<boolean>;
}
/** 管理零登录项目 RAG 的新手一键准备流程；失败不影响 local 模式。 */
export declare class KnowledgeSetupService {
    private readonly home;
    private readonly onReady?;
    private readonly dependencies;
    private status;
    private task?;
    constructor(home?: string, onReady?: (() => void | Promise<void>) | undefined, dependencies?: SetupDependencies);
    defaultInstallRoot(): string;
    /** 返回环境与服务状态，不泄露数据库密码。 */
    describe(): Promise<SetupStatus>;
    /** 只执行版本/服务探测，不下载、不安装、不修改系统。 */
    private inspectPrerequisites;
    /** 启动幂等后台准备任务；同一时间只允许一个任务。 */
    start(installRoot?: string, ragApiKey?: string): SetupStatus;
    private initialStatus;
    private run;
    private statusPath;
    private logPath;
    private serviceLogPath;
    private update;
    private readPersistedStatus;
    private loadOrCreateSecrets;
}
