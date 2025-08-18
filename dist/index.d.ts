#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';
export declare const configSchema: z.ZodObject<{
    apiKey: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodString>;
    clientSecret: z.ZodOptional<z.ZodString>;
    apiBaseUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    apiKey?: string | undefined;
    clientId?: string | undefined;
    clientSecret?: string | undefined;
    apiBaseUrl?: string | undefined;
}, {
    apiKey?: string | undefined;
    clientId?: string | undefined;
    clientSecret?: string | undefined;
    apiBaseUrl?: string | undefined;
}>;
export default function createServer({ config, }: {
    config: z.infer<typeof configSchema>;
}): Server<{
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number | undefined;
        } | undefined;
    } | undefined;
}, {
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | undefined;
}, {
    [x: string]: unknown;
    _meta?: {
        [x: string]: unknown;
    } | undefined;
}>;
