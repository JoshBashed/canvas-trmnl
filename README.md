# Canvas-TRMNL

Show your assignments from Canvas LMS on your TRMNL.

## What does it do?

- Fetches your assignments from Canvas.
- Shows them as a TRMNL plugin.

It's as simple as that.

## How to use it?

1. Install the plugin from [here](https://trmnl.com/plugin_settings/new?keyname=canvas_lms).
2. Enter your canvas domain + access token (generate one in settings).
3. TRMNL will start showing your Canvas data.

## Development

Clone the repo then run the following commands to start the development server:
```bash
pnpm install
pnpm dev
```

## Tech stack

- Hono (webserver)
- React (frontend)
- Drizzle (orm)
- Postgres (db)
- Rollup (bundler)

(hosted on Digital Ocean)

## Contributing

Contributions are welcome!

## License

Licensed under the ISC License. See the [LICENSE](LICENSE.md) file for details.
