# Examples

This directory demonstrates how to use **openapi-tools** with the Swagger Pet Store specification.

The Pet Store spec is available at:

```
https://raw.githubusercontent.com/readmeio/oas-examples/main/3.1/yaml/petstore.yaml
```

## Filtering Paths

You can filter the specification to only include certain paths. The example below selects all operations under `/pet` and writes them to `filtered.yaml`:

```bash
npx @ai-foundry/openapi-tools filter \
  --input https://raw.githubusercontent.com/readmeio/oas-examples/main/3.1/yaml/petstore.yaml \
  --output ./filtered.yaml \
  --select-paths "/pet"
```

## Generate Zod Schemas

To generate Zod schemas for the same path prefix:

```bash
npx @ai-foundry/openapi-tools generate-zod \
  --input https://raw.githubusercontent.com/readmeio/oas-examples/main/3.1/yaml/petstore.yaml \
  --output ./zod \
  --select-paths "/pet"
```

## Generate Python TypedDicts

To create Python `TypedDict` definitions:

```bash
npx @ai-foundry/openapi-tools generate-python-dict \
  --input https://raw.githubusercontent.com/readmeio/oas-examples/main/3.1/yaml/petstore.yaml \
  --output ./typed-dict \
  --select-paths "/pet"
```
