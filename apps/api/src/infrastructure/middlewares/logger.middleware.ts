import { TRPCMiddleware, MiddlewareOptions } from 'nestjs-trpc';
import { Inject, Injectable, ConsoleLogger } from '@nestjs/common';
import { getBaseUrl } from '@api/src/infrastructure/utils/request-url';

const BORDER = '────────────────────────────────────────────────────────';

@Injectable()
export class LoggedMiddleware implements TRPCMiddleware {
    constructor(
        @Inject(ConsoleLogger) private readonly consoleLogger: ConsoleLogger
    ) { }

    private jsonBlock(value: unknown): string {
        if (value === undefined) return '—';
        const str = JSON.stringify(value, null, 2);
        return str.split('\n').map((line) => '  ' + line).join('\n');
    }

    /**
     * Build a serializable object from an error so the full message, cause and stack are logged.
     */
    private serializeError(err: unknown): Record<string, unknown> {
        if (err instanceof Error) {
            const out: Record<string, unknown> = {
                name: err.name,
                message: err.message,
                ...(err.stack && { stack: err.stack }),
            };
            if (err['cause'] !== undefined) {
                const cause = err['cause'];
                out['cause'] = cause instanceof Error
                    ? this.serializeError(cause)
                    : cause;
            }
            const rest = { ...err } as Record<string, unknown>;
            if (rest['code'] !== undefined) out['code'] = rest['code'];
            if (rest['data'] !== undefined) out['data'] = rest['data'];
            return out;
        }
        return { raw: err };
    }

    private buildHeader(requestUrl: string, path: string, type: string, durationMs: number, input: unknown): string {
        const lines: string[] = [
            '',
            BORDER,
            '  REQUEST',
            `  ${requestUrl}`,
            '',
            '  META',
            `  path     ${path}`,
            `  type     ${type}`,
            `  duration ${durationMs} ms`,
        ];
        if (input !== undefined && input !== null && Object.keys(input as object).length > 0) {
            lines.push('', '  INPUT', this.jsonBlock(input));
        }
        return lines.join('\n');
    }

    async use(opts: MiddlewareOptions<{ req: any; res: any }>) {
        const start = Date.now();
        const { next, path, type, input, ctx } = opts;
        const baseUrl = ctx?.req ? getBaseUrl(ctx.req) : '';
        const requestUrl = baseUrl ? `${baseUrl}/trpc/${path}` : path;

        try {
            const result = await next();
            const durationMs = Date.now() - start;
            const header = this.buildHeader(requestUrl, path, type, durationMs, input);

            if (result?.ok === false) {
                const errPayload = result?.error ?? result;
                const serialized = errPayload instanceof Error
                    ? this.serializeError(errPayload)
                    : errPayload;
                const log =
                    header +
                    '\n\n  RESPONSE (error)\n' +
                    this.jsonBlock(serialized) +
                    '\n' + BORDER + '\n';
                this.consoleLogger.error(log);
            } else {
                const payload = result?.data ?? result;
                const log =
                    header +
                    '\n\n  RESPONSE\n' +
                    this.jsonBlock(payload) +
                    '\n' + BORDER + '\n';
                this.consoleLogger.log(log);
            }

            return result;
        } catch (err) {
            const durationMs = Date.now() - start;
            const serialized = err instanceof Error ? this.serializeError(err) : { raw: err };
            const log =
                this.buildHeader(requestUrl, path, type, durationMs, input) +
                '\n\n  RESPONSE (thrown)\n' +
                this.jsonBlock(serialized) +
                '\n' + BORDER + '\n';
            this.consoleLogger.error('\n' + log);
            throw err;
        }
    }
}