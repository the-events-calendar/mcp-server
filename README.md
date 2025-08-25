# The Events Calendar MCP Server

An MCP (Model Context Protocol) server that provides unified CRUD operations for The Events Calendar and Event Tickets WordPress plugins.

## Features

- **Unified Tools**: Single tools for Create/Update, Read, Delete, and Search operations across all post types
- **Supported Post Types**:
  - Events (`tribe_events`)
  - Venues (`tribe_venue`)
  - Organizers (`tribe_organizer`)
  - Tickets (`tribe_rsvp_tickets` or `tec_tc_ticket`)
- **Full CRUD Operations**: Create, Read, Update, Delete with proper error handling
- **Search Functionality**: Integrated search via the read tool with query parameter
- **Type Safety**: Full TypeScript support with proper type definitions
 

## Requirements

- Node.js >= v20.0.0
- WordPress site with The Events Calendar plugin
- WordPress Application Password for authenticationd

## Installation

<details>
<summary><b>Install in Cursor</b></summary>

Go to: `Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`

Pasting the following configuration into your Cursor `~/.cursor/mcp.json` file is the recommended approach. You may also install in a specific project by creating `.cursor/mcp.json` in your project folder. See [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol) for more info.

> Since Cursor 1.0, you can click the install button below for instant one-click installation.

#### Cursor Local Server Connection

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=events-mcp&config=eyJjb21tYW5kIjoibnB4IC15IEB0aGUtZXZlbnRzLWNhbGVuZGFyL21jcC1zZXJ2ZXIifQ%3D%3D)

```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {
        "WP_APP_PASSWORD": "your-application-password"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Claude Code</b></summary>

Run this command. See [Claude Code MCP docs](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/tutorials#set-up-model-context-protocol-mcp) for more info.

 
#### Claude Code Local Server Connection

```sh
WP_APP_PASSWORD="your-application-password" claude mcp add tec-mcp -- npx -y @the-events-calendar/mcp-server --url https://your-wordpress-site.com --username your-username
```

</details>

<details>
<summary><b>Install in Windsurf</b></summary>

Add this to your Windsurf MCP config file. See [Windsurf MCP docs](https://docs.windsurf.com/windsurf/cascade/mcp) for more info.

 

#### Windsurf Local Server Connection

```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {
        "WP_APP_PASSWORD": "your-application-password"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in VS Code</b></summary>

[<img alt="Install in VS Code (npx)" src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20TEC%20MCP&color=0098FF">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22tec-mcp%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40the-events-calendar%2Fmcp-server%40latest%22%5D%7D)
[<img alt="Install in VS Code Insiders (npx)" src="https://img.shields.io/badge/VS_Code_Insiders-VS_Code_Insiders?style=flat-square&label=Install%20TEC%20MCP&color=24bfa5">](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%7B%22name%22%3A%22tec-mcp%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40the-events-calendar%2Fmcp-server%40latest%22%5D%7D)

Add this to your VS Code MCP config file. See [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for more info.

 

#### VS Code Local Server Connection

```json
"mcp": {
  "servers": {
    "tec-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {
        "WP_APP_PASSWORD": "your-application-password"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Zed</b></summary>

It can be installed via [Zed Extensions](https://zed.dev/extensions?query=The%20Events%20Calendar) or you can add this to your Zed `settings.json`. See [Zed Context Server docs](https://zed.dev/docs/assistant/context-servers) for more info.

```json
{
  "context_servers": {
    "TEC MCP": {
      "command": {
        "path": "npx",
        "args": [
          "-y",
          "@the-events-calendar/mcp-server",
          "--url",
          "https://your-wordpress-site.com",
          "--username",
          "your-username"
        ]
      },
      "env": {"WP_APP_PASSWORD": "your-application-password"},
      "settings": {}
    }
  }
}
```

</details>

<details>
<summary><b>Install in Augment Code</b></summary>

To configure TEC MCP in Augment Code, you can use either the graphical interface or manual configuration.

### **A. Using the Augment Code UI**

1. Click the hamburger menu.
2. Select **Settings**.
3. Navigate to the **Tools** section.
4. Click the **+ Add MCP** button.
5. Enter the following command:

   ```
   WP_APP_PASSWORD="your-application-password" npx -y @the-events-calendar/mcp-server@latest --url https://your-wordpress-site.com --username your-username
   ```

6. Name the MCP: **TEC MCP**.
7. Click the **Add** button.

Once the MCP server is added, you can start using the TEC MCP tools directly within Augment Code.

---

### **B. Manual Configuration**

1. Press Cmd/Ctrl Shift P or go to the hamburger menu in the Augment panel
2. Select Edit Settings
3. Under Advanced, click Edit in settings.json
4. Add the server configuration to the `mcpServers` array in the `augment.advanced` object

```json
"augment.advanced": {
  "mcpServers": [
    {
      "name": "tec-mcp",
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"}
    }
  ]
}
```

Once the MCP server is added, restart your editor. If you receive any errors, check the syntax to make sure closing brackets or commas are not missing.

</details>

<details>
<summary><b>Install in Roo Code</b></summary>

Add this to your Roo Code MCP configuration file. See [Roo Code MCP docs](https://docs.roocode.com/features/mcp/using-mcp-in-roo) for more info.


#### Roo Code Local Server Connection

```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"}
    }
  }
}
```

</details>

<details>
<summary><b>Install in Gemini CLI</b></summary>

See [Gemini CLI Configuration](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html) for details.

1.  Open the Gemini CLI settings file. The location is `~/.gemini/settings.json` (where `~` is your home directory).
2.  Add the following to the `mcpServers` object in your `settings.json` file:

```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"}
    }
  }
}
```

If the `mcpServers` object does not exist, create it.

</details>

<details>
<summary><b>Install in Claude Desktop</b></summary>

Open Claude Desktop and navigate to Settings > Connectors > Add Custom Connector. Enter the name as `TEC MCP` and configure it to launch via `npx`.

#### Local Server Connection

Open Claude Desktop developer settings and edit your `claude_desktop_config.json` file to add the following configuration. See [Claude Desktop MCP docs](https://modelcontextprotocol.io/quickstart/user) for more info.

```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "npx",
      "args": ["-y", "@the-events-calendar/mcp-server"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Opencode</b></summary>

Add this to your Opencode configuration file. See [Opencode MCP docs](https://opencode.ai/docs/mcp-servers) docs for more info.

 

#### Opencode Local Server Connection

```json
{
  "mcp": {
    "tec-mcp": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"},
      "enabled": true
    }
  }
}
```

</details>
<details>
<summary><b>Install in OpenAI Codex</b></summary>

See [OpenAI Codex](https://github.com/openai/codex) for more information.

Add the following configuration to your OpenAI Codex MCP server settings:

```toml
[mcp_servers.tec-mcp]
args = [
"-y",
"@the-events-calendar/mcp-server",
"--url",
"https://your-wordpress-site.com",
"--username",
"your-username"
]
command = "npx"
```

</details>

<details>
<summary><b>Install in JetBrains AI Assistant</b></summary>

See [JetBrains AI Assistant Documentation](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html) for more details.

1. In JetBrains IDEs go to `Settings` -> `Tools` -> `AI Assistant` -> `Model Context Protocol (MCP)`
2. Click `+ Add`.
3. Click on `Command` in the top-left corner of the dialog and select the As JSON option from the list
4. Add this configuration and click `OK`

```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"}
    }
  }
}
```

5. Click `Apply` to save changes.
6. The same way TEC MCP could be added for JetBrains Junie in `Settings` -> `Tools` -> `Junie` -> `MCP Settings`

</details>

<details>
  
<summary><b>Install in Kiro</b></summary>

See [Kiro Model Context Protocol Documentation](https://kiro.dev/docs/mcp/configuration/) for details.

1. Navigate `Kiro` > `MCP Servers`
2. Add a new MCP server by clicking the `+ Add` button.
3. Paste the configuration given below:

```json
{
  "mcpServers": {
    "TEC MCP": {
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

4. Click `Save` to apply the changes.

</details>

<details>
<summary><b>Install in Trae</b></summary>

Use the Add manually feature and fill in the JSON configuration information for that MCP server.
For more details, visit the [Trae documentation](https://docs.trae.ai/ide/model-context-protocol?_lang=en).

 

#### Trae Local Server Connection

```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"}
    }
  }
}
```

</details>

<details>
<summary><b>Using Bun or Deno</b></summary>

Use these alternatives to run the local TEC MCP server with other runtimes. These examples work for any client that supports launching a local MCP server via command + args.

#### Bun

```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "bunx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"}
    }
  }
}
```

#### Deno

```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "deno",
      "args": [
        "run",
        "--allow-env=NO_DEPRECATION,TRACE_DEPRECATION",
        "--allow-net",
        "npm:@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"}
    }
  }
}
```

</details>

<details>
<summary><b>Using Docker</b></summary>

If you prefer to run the MCP server in a Docker container:

1. **Build the Docker Image:**

   First, create a `Dockerfile` in the project root (or anywhere you prefer):

   <details>
   <summary>Click to see Dockerfile content</summary>

   ```Dockerfile
   FROM node:18-alpine

   WORKDIR /app

   # Install the latest version globally
   RUN npm install -g @the-events-calendar/mcp-server

   # Expose default port if needed (optional, depends on MCP client interaction)
   # EXPOSE 3000

   # Default command to run the server
   CMD ["mcp-server"]
   ```

   </details>

   Then, build the image using a tag (e.g., `tec-mcp`). **Make sure Docker Desktop (or the Docker daemon) is running.** Run the following command in the same directory where you saved the `Dockerfile`:

   ```bash
   docker build -t tec-mcp .
   ```

2. **Configure Your MCP Client:**

   Update your MCP client's configuration to use the Docker command.

   _Example for a cline_mcp_settings.json:_

   ```json
   {
     "mcpServers": {
       "TEC MCP": {
         "autoApprove": [],
         "disabled": false,
         "timeout": 60,
         "command": "docker",
         "args": ["run", "-i", "--rm", "tec-mcp"],
         "transportType": "stdio"
       }
     }
   }
   ```

   _Note: This is an example configuration. Please refer to the specific examples for your MCP client (like Cursor, VS Code, etc.) earlier in this README to adapt the structure (e.g., `mcpServers` vs `servers`). Also, ensure the image name in `args` matches the tag used during the `docker build` command._

</details>

<details>
<summary><b>Install in Windows</b></summary>

The configuration on Windows is slightly different compared to Linux or macOS (_`Cline` is used in the example_). The same principle applies to other editors; refer to the configuration of `command` and `args`.

```json
{
  "mcpServers": {
    "github.com/the-events-calendar/mcp-server": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

</details>

<details>
<summary><b>Install in Amazon Q Developer CLI</b></summary>

Add this to your Amazon Q Developer CLI configuration file. See [Amazon Q Developer CLI docs](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-mcp-configuration.html) for more details.

```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"}
    }
  }
}
```

</details>

<details>
<summary><b>Install in Warp</b></summary>

See [Warp Model Context Protocol Documentation](https://docs.warp.dev/knowledge-and-collaboration/mcp#adding-an-mcp-server) for details.

1. Navigate `Settings` > `AI` > `Manage MCP servers`.
2. Add a new MCP server by clicking the `+ Add` button.
3. Paste the configuration given below:

```json
{
  "TEC MCP": {
    "command": "npx",
    "args": [
      "-y",
      "@the-events-calendar/mcp-server",
      "--url",
      "https://your-wordpress-site.com",
      "--username",
      "your-username"
    ],
    "env": {"WP_APP_PASSWORD": "your-application-password"},
    "working_directory": null,
    "start_on_launch": true
  }
}
```

4. Click `Save` to apply the changes.

</details>

<details>

<summary><b>Install in Copilot Coding Agent</b></summary>

## Using TEC MCP with Copilot Coding Agent

Add the following configuration to the `mcp` section of your Copilot Coding Agent configuration file Repository->Settings->Copilot->Coding agent->MCP configuration:

```json
{
  "mcpServers": {
    "tec-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"}
    }
  }
}
```

For more information, see the [official GitHub documentation](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/agents/copilot-coding-agent/extending-copilot-coding-agent-with-mcp).

</details>

<details>
<summary><b>Install in LM Studio</b></summary>

See [LM Studio MCP Support](https://lmstudio.ai/blog/lmstudio-v0.3.17) for more information.q

#### Manual set-up:

1. Navigate to `Program` (right side) > `Install` > `Edit mcp.json`.
2. Paste the configuration given below:

```json
{
  "mcpServers": {
    "TEC MCP": {
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"}
    }
  }
}
```

3. Click `Save` to apply the changes.
4. Toggle the MCP server on/off from the right hand side, under `Program`, or by clicking the plug icon at the bottom of the chat box.

</details>

<details>
<summary><b>Install in Visual Studio 2022</b></summary>

You can configure TEC MCP in Visual Studio 2022 by following the [Visual Studio MCP Servers documentation](https://learn.microsoft.com/visualstudio/ide/mcp-servers?view=vs-2022).

Add this to your Visual Studio MCP config file (see the [Visual Studio docs](https://learn.microsoft.com/visualstudio/ide/mcp-servers?view=vs-2022) for details):

```json
{
  "mcp": {
    "servers": {
      "tec-mcp": {
        "type": "stdio",
        "command": "npx",
        "args": [
          "-y",
          "@the-events-calendar/mcp-server",
          "--url",
          "https://your-wordpress-site.com",
          "--username",
          "your-username"
        ],
        "env": {"WP_APP_PASSWORD": "your-application-password"}
      }
    }
  }
}
```

For more information and troubleshooting, refer to the [Visual Studio MCP Servers documentation](https://learn.microsoft.com/visualstudio/ide/mcp-servers?view=vs-2022).

</details>

<details>
<summary><b>Install in Crush</b></summary>

Add this to your Crush configuration file. See [Crush MCP docs](https://github.com/charmbracelet/crush#mcps) for more info.

 



#### Crush Local Server Connection

```json
{
  "$schema": "https://charm.land/crush.json",
  "mcp": {
    "tec-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"}
    }
  }
}
```

</details>

<details>
<summary><b>Install in BoltAI</b></summary>

Open the "Settings" page of the app, navigate to "Plugins," and enter the following JSON:

```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"}
    }
  }
}
```

Once saved, you can start using the TEC MCP tools. More information is available on [BoltAI's Documentation site](https://docs.boltai.com/docs/plugins/mcp-servers). For BoltAI on iOS, [see this guide](https://docs.boltai.com/docs/boltai-mobile/mcp-servers).

</details>

<details>
<summary><b>Install in Rovo Dev CLI</b></summary>

Edit your Rovo Dev CLI MCP config by running the command below -

```bash
acli rovodev mcp
```

Example config -

 

#### Local Server Connection

```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
      ],
      "env": {"WP_APP_PASSWORD": "your-application-password"}
    }
  }
}
```

</details>

<details>
<summary><b>Install in Zencoder</b></summary>

To configure TEC MCP in Zencoder, follow these steps:

1. Go to the Zencoder menu (...)
2. From the dropdown menu, select Agent tools
3. Click on the Add custom MCP
4. Add the name and server configuration from below, and make sure to hit the Install button

```json
{
  "command": "npx",
  "args": [
    "-y",
    "@the-events-calendar/mcp-server",
    "--url",
    "https://your-wordpress-site.com",
    "--username",
    "your-username"
  ],
  "env": {
    "WP_APP_PASSWORD": "your-application-password"
  }
}
```

Once the MCP server is added, you can easily continue using it.

</details>

<details>
<summary><b>Install in Qodo Gen</b></summary>

See [Qodo Gen docs](https://docs.qodo.ai/qodo-documentation/qodo-gen/qodo-gen-chat/agentic-mode/agentic-tools-mcps) for more details.

1. Open Qodo Gen chat panel in VSCode or IntelliJ.
2. Click Connect more tools.
3. Click + Add new MCP.
4. Add the following configuration:

#### Qodo Gen Local Server Connection

```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url",
        "https://your-wordpress-site.com",
        "--username",
        "your-username"
        "--password",
        "your-password"
      ]
    }
  }
}
```
</details>

<details>
<summary><b>Install in Perplexity Desktop</b></summary>

See [Local and Remote MCPs for Perplexity](https://www.perplexity.ai/help-center/en/articles/11502712-local-and-remote-mcps-for-perplexity) for more information.

1. Navigate `Perplexity` > `Settings`
2. Select `Connectors`.
3. Click `Add Connector`.
4. Select `Advanced`.
5. Enter Server Name: `TEC MCP`
6. Paste the following JSON in the text area:

```json
{
  "command": "npx"
  "args": [
    "-y",
    "@the-events-calendar/mcp-server",
    "--url",
    "https://your-wordpress-site.com",
    "--username",
    "your-username"
  ],
  "env": {
    "WP_APP_PASSWORD": "your-application-password"
  }
}
```

7. Click `Save`.
</details>

### Command-Line Options

| Option | Description |
|--------|-------------|
| `--url <url>` | WordPress site URL (required) |
| `--username <username>` | WordPress username (required) |
| `--password <password>` | WordPress application password (required) |
| `--ignore-ssl-errors` | Ignore SSL certificate errors (for local development) |
| `--log-level <level>` | Set logging level (error, warn, info, http, verbose, debug, silly) |
| `--log-file <path>` | Write logs to file (suppresses console output for clean MCP protocol) |
| `--help`, `-h` | Show help message |

### Authentication Setup

#### Creating a WordPress Application Password

1. Log in to your WordPress admin dashboard
2. Navigate to Users → Your Profile
3. Scroll down to "Application Passwords" section
4. Enter a name for this application (e.g., "MCP Server")
5. Click "Add New Application Password"
6. Copy the generated password (spaces can be included)

#### Security Best Practices

- Never commit passwords to version control
- Use environment variables or secure configuration files
- Rotate application passwords regularly
- Use SSL/HTTPS for production sites
- Restrict application password permissions when possible


## Available Tools

### 1. `tec-calendar-create-update-entities`

Create or update a post. If an ID is provided, it updates; otherwise, it creates.

**Parameters:**

- `postType`: "event" | "venue" | "organizer" | "ticket"
- `id`: (optional) Post ID for updates
- `data`: Post data object (fields depend on post type)

**Example - Create Event:**

```json
{
  "postType": "event",
  "data": {
    "title": "My Event",
    "start_date": "2024-12-25 10:00:00",
    "end_date": "2024-12-25 18:00:00",
    "venue": 123
  }
}
```

**Example - Create Event with Nested Venue:**

```json
{
  "postType": "event",
  "data": {
    "title": "Conference 2024",
    "start_date": "2024-12-25 10:00:00",
    "end_date": "2024-12-25 18:00:00",
    "venue": {
      "venue": "Convention Center",
      "address": "123 Main St",
      "city": "New York",
      "state_province": "NY",
      "zip": "10001",
      "country": "US"
    }
  }
}
```

### 2. `tec-calendar-read-entities`

Read a single post by ID or list posts with filters.

**Parameters:**

- `postType`: "event" | "venue" | "organizer" | "ticket"
- `id`: (optional) Post ID for single post
- `query`: (optional) Search term
- Common filters (all post types):
  - `page`: Page number
  - `per_page`: Items per page (max 100 by default)
  - `status`: Post status
  - `order`: "asc" | "desc"
  - `orderby`: Field to order by
  - `include`: Array of specific IDs to include
  - `exclude`: Array of specific IDs to exclude
- `eventFilters`: (optional) Event-specific filters
  - `start_date`: Events starting after this date
  - `end_date`: Events ending before this date
  - `venue`: Filter by venue ID
  - `organizer`: Filter by organizer ID

**Example - List Events:**

```json
{
  "postType": "event",
  "per_page": 10,
  "status": "publish",
  "eventFilters": {
    "start_date": "2024-12-01",
    "end_date": "2024-12-31"
  }
}
```

**Example - Search Events:**

```json
{
  "postType": "event",
  "query": "conference",
  "per_page": 20
}
```

### 3. `tec-calendar-delete-entities`

Delete a post (soft delete to trash or permanent delete).

**Parameters:**

- `postType`: "event" | "venue" | "organizer" | "ticket"
- `id`: Post ID to delete
- `force`: (optional) true for permanent delete, false for trash

**Example:**

```json
{
  "postType": "event",
  "id": 123,
  "force": false
}
```



## Development

### Setting Up for Development

1. Clone the repository:
```bash
git clone https://github.com/the-events-calendar/mcp-server.git
cd mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment template:
```bash
cp .env.example .env
```

4. Configure `.env` with your credentials:
```env
WP_URL=https://your-wordpress-site.com
WP_USERNAME=your-username
WP_APP_PASSWORD=your-application-password
LOG_LEVEL=info
```

5. Run in development mode:
```bash
npm run dev
```

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Run in watch mode with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run the compiled server |
| `npm run start:bun` | Run with Bun runtime |
| `npm run start:debug` | Run with debug logging |

### Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|  
| `WP_URL` | WordPress site URL | Required |
| `WP_USERNAME` | WordPress username | Required |
| `WP_APP_PASSWORD` | Application password | Required |
| `WP_IGNORE_SSL_ERRORS` | Ignore SSL errors | `false` |
| `WP_ENFORCE_PER_PAGE_LIMIT` | Enforce 100 item limit | `true` |
| `MCP_SERVER_NAME` | Server identifier | `tec-mcp-server` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `LOG_FILE` | Log output file | Console output |

## Important Notes

### Per-Page Limits

By default, the API limits results to 100 items per page. To disable this limit:

- Set `WP_ENFORCE_PER_PAGE_LIMIT=false` in your environment
- Or use smaller `per_page` values in your requests

### Post Type Names

Use the simplified post type names:

- Events: `event`
- Venues: `venue`
- Organizers: `organizer`
- Tickets: `ticket`

## Additional Resources

- [TOOLS_GUIDE.md](./TOOLS_GUIDE.md) - Comprehensive guide with examples for all tools
- [examples/](./examples/) - Configuration examples for various MCP clients
- [GitHub Issues](https://github.com/the-events-calendar/mcp-server/issues) - Report bugs or request features

## License

ISC
