// Minimal types for the Mono Connect widget (@mono.co/connect.js ships none).
declare module '@mono.co/connect.js' {
  export interface MonoConnectOptions {
    /** The PUBLIC key returned by GET /finance/integrations (connect_config.public_key). */
    key: string;
    onSuccess: (data: { code: string }) => void;
    onClose?: () => void;
    onLoad?: () => void;
    onEvent?: (eventName: string, data: unknown) => void;
    reference?: string;
  }
  export default class MonoConnect {
    constructor(options: MonoConnectOptions);
    setup(config?: Record<string, unknown>): void;
    open(): void;
    close(): void;
  }
}
