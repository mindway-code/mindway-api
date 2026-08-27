export type OpenApiContent = Record<string, unknown>;
export type OpenApiPathItem = Record<string, unknown>;
export type OpenApiPaths = Record<string, OpenApiPathItem>;

export type OpenApiDocument = {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description: string }>;
  tags: Array<{ name: string; description: string }>;
  paths: OpenApiPaths;
  components: OpenApiContent;
};
