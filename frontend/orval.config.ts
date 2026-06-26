import { defineConfig } from 'orval';

export default defineConfig({
    galleryApi: {
        input: {
            target: './openapi.json',
        },
        output: {
            mode: 'tags-split',
            target: './src/api/generated/api.ts',
            schemas: './src/api/generated/models',
            client: 'react-query',
            override: {
                mutator: {
                    path: './src/api/client.ts',
                    name: 'customInstance',
                },
                query: {
                    useQuery: true,
                    useInfinite: false,
                },
                operations: {
                    'AuthController_login': {
                        query: {
                            useMutation: true,
                        },
                    },
                    'AuthController_register': {
                        query: {
                            useMutation: true,
                        },
                    },
                    'AuthController_refresh': {
                        query: {
                            useMutation: true,
                        },
                    },
                    'AuthController_logout': {
                        query: {
                            useMutation: true,
                        },
                    },
                    'AuthController_getMe': {
                        query: {
                            useQuery: true,
                        },
                    },
                },
            },
        },
        hooks: {
            afterAllFilesWrite: 'prettier --write',
        },
    },
});