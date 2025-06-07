# openapi-tools

**openapi-tools** is a small toolbox for slicing, validating and generating code from OpenAPI specifications. It ships as a command line utility so you can keep your API definitions tidy and reusable.

## Features

- **Filter paths** – create a minimal spec containing only the operations you care about.
- **Generate Zod schemas** – produce TypeScript models ready for runtime validation.
- **Generate Python `TypedDicts`** – build strongly typed models for Python projects.

## Installation

Use `npx` for one-off runs or install globally:

```bash
npm install -g @ai-foundry/openapi-tools
```

The examples below use the OpenAPI Pet Store specification. More scenarios are available in the [examples directory](examples/README.md).

### Quick Start

```bash
npx @ai-foundry/openapi-tools filter --input openapi.yaml --output filtered.yaml --select-paths "/pet/{petId}"
```

### Using Docker

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

The output will be a single TypeScript file with all schemas.

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

## Contributing

1. Clone this repository and run `npm install`.
2. Make your changes and add tests if applicable.
3. Open a pull request – we welcome improvements and new features!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
