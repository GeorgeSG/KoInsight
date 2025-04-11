<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/heading.png">
    <img src="images/heading-dark.png" width="80%">
  </picture>
</p>

<p align="center">
<strong>KoInsight</strong> brings your KoReader reading stats to life with a clean, web-based dashboard.
</p>

<p align="center">
   <picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/screenshots/stats_1_d.png">
    <img src="images/screenshots/stats_1_l.png" width="100%">
  </picture>
</p>

# Features

- Import & Visualize KoReader reading statistics
- Keep track of your reading habits
- Act as a KoReader Sync Server
- Custom KoReader plugin for easier sync

# Screenshots
<table>
  <tr>
    <td><strong>Home page</strong></td>
    <td><strong>Book view</strong></td>
  </tr>
  <tr>
    <td><img src="images/screenshots/book_ld.png" width="300"/></td>
    <td><img src="images/screenshots/home_ld.png" width="300"/></td>
  </tr>
  <tr>
    <td><strong>Statistics</strong></td>
    <td><strong>Statistics</strong></td>
  </tr>
  <tr>
    <td><img src="images/screenshots/stats_1_ld.png" width="300"/></td>
    <td><img src="images/screenshots/stats_2_ld.png" width="300"/></td>
  </tr>
</table>

See all [screenshots](/images/screenshots/)


# Installation
Using [Docker](https://docker.com) and [Docker Compose](https://docs.docker.com/compose/)

Add the following to your `compose.yaml` file:

```yaml
name: koinsight
services:
  koinsight:
    image: ghcr.io/georgesg/koinsight:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
```
Run `docker compose up -d`.

# Usage

## Reading statistics

To start seeing data in KoInsight, you need to upload your reading statistics.
Currently, there are two ways to do this:

1. **Manual upload**: Extract your `statistics.sqlite` file from KoReader and upload it using the **"Upload Statistics DB"** button in KoInsight.
2. **Sync plugin**: Install and configure the KoInsight plugin in KoReader to sync your data directly.

### KoReader sync plugin
The KoInsight plugin syncs your reading statistics from KoReader to KoInsight.

**Installation:**
1. Download the plugin ZIP bundle from the **"KoReader Plugin"** button in the main menu.
1. Extract it into your `koreader/plugins/` folder.

**Usage:**
1. Open the KoReader app.
1. Go to the **Tools** menu and open **KoInsight** (it should be below "More tools").
1. Click **Configure KoInsight** and enter your KoInsight server URL (e.g., `http://server-ip:3000`).
    - ⚠️ Make sure your KoReader device has network access to the server.
1. Click **Sync** in the KoInsight plugin menu.

Reload the KoInsight web dashboard. If everything went well (🤞), your data should appear.

### Manual Upload: `statistics.sqlite`
1. Open a file manager on your KoReader device.
1. Navigate to the `koreader/settings/` folder.
1. Locate the `statistics.sqlite` file.
1. Copy it to your computer.
1. Upload it to KoInsight using the **"Upload Statistics DB"** button.
1. Reload the KoInsight web dashboard.

Every time you need to reupload data, you would need to upload the statistics database file again.

## Use as progress sync server

You can use your KoInsight instance as a KoReader sync server. This allows you to sync your reading progress across multiple devices.

1. Open the KoReader app.
1. Go to the **Tools** menu and open **Progress sync**
1. Set the server URL to your KoInsight instance (e.g., `http://server-ip:3000`).
1. Register an account and login.
1. Sync your progress.

The progress sync data should appear in the **"Progress syncs"** page in KoInsight.

# Roadmap
(a.k.a thinkgs I want to do)

1. **Books**
    1. Mark as read
    1. Mark as unread
    1. Edit / add details manually
    1. Manual cover upload
    1. Automatically fetch book cover on new book upload
1. **Statistics**
    1. Map KoReader page count to actual page count for better per-page statistics.
1. **AI Enhancements**
    1. Get book information - description, similar books
    1. Tag / Categorize books based on genres
    1. Book recommendations?
1. **Progress sync management**
    1. Delete progress syncs
    1. Edit progress syncs
    1. Device management
