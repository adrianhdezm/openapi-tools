# openapi-tools

A CLI tool to work with OpenAPI specifications, including generation, validation, and more.

## Usage Example

Below is a quick example using the OpenAPI Pet Store:

```bash
npx @ai-foundry/openapi-tools filter --input openapi.yaml --output filtered.yaml --select-paths "/pet/{petId}"
```

### Using with Docker

You can also use the tool via Docker:

```bash
docker run --rm -v $(pwd)/local-schemas:/app/schemas adrianhdezm/openapi-tools filter --input ./schemas/openapi.yaml --output ./schemas/filtered.yaml --select-paths "/pet/{petId}"
```

## Command Reference

```bash
Usage: openapi-tools [options] [command]

OpenAPI Tools CLI

Options:
  -V, --version                   output the version number
  -h, --help                      display help for command

Commands:
  filter [options]                Filter OpenAPI spec by comma-separated list of path names
  generate-zod [options]          Generate Zod schemas from an OpenAPI spec
  generate-python-dict [options]  Generate Python TypedDicts from an OpenAPI spec
  help [command]                  display help for command
```

### Filter Command

```bash
Usage: openapi-tools filter [options]

Filter OpenAPI spec by comma-separated list of path names

Options:
  --input <input>         Input OpenAPI (YAML or JSON) file or URL
  --output <output>       Output filtered YAML file
  --select-paths <paths>  Comma-separated list of path names, e.g.,
                          "/v1/chat/completions,/v1/models"
  -h, --help              display help for command
```

### Generate Zod Command

```bash
Usage: openapi-tools generate-zod [options]

Generate Zod schemas from an OpenAPI spec

Options:
  --input <input>             Input OpenAPI file (YAML or JSON) or URL
  --output <output>           Output file for schemas
  -p, --select-paths <paths>  Comma-separated list of path prefixes
  -h, --help                  display help for command
```

### Generate Python TypedDict Command

```bash
Usage: openapi-tools generate-python-dict [options]

Generate Python TypedDicts from an OpenAPI spec

Options:
  --input <input>             Input OpenAPI file (YAML or JSON) or URL
  --output <output>           Output file for schemas
  -p, --select-paths <paths>  Comma-separated list of path prefixes
  -h, --help                  display help for command
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
