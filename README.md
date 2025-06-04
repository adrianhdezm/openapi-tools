# openapi-tools

A CLI tool to work with OpenAPI specifications, including generation, validation, and more.

## Usage Example

Below is a quick example using the Azure OpenAI Service:

```bash
npx @ai-foundry/openapi-tools filter --input openapi.yaml --output filtered.yaml --select-paths "/pet/{petId},/pet/findByStatus"
```

### Docker Usage Example

You can also use the tool via Docker:

```bash
docker run --rm -v $(pwd)/local-schemas:/app/schemas adrianhdezm/openapi-tools filter --input ./schemas/openapi.yaml --output ./schemas/filtered.yaml --select-paths "/pet/{petId},/pet/findByStatus"
```

## Command Reference

```
Usage: openapi-tools filter [options]

Filter OpenAPI spec by comma-separated list of path names

Options:
  --input <input>         Input OpenAPI YAML file
  --output <output>       Output filtered YAML file
  --select-paths <paths>  Comma-separated list of path names, e.g.,
                          "/v1/chat/completions,/v1/models"
  -h, --help              display help for command
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
