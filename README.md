<div align="center">  

# 🔄 Sync Notion-GoogleCalendar

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)  
[![Language: JavaScript](https://img.shields.io/badge/Language-JavaScript-f1e05a.svg)](https://github.com/yusuke-na/SyncNotionGoogleCalendar)  
[![Platform: Google Apps Script](https://img.shields.io/badge/Platform-Google%20Apps%20Script-blue.svg)](https://developers.google.com/apps-script)  
[![API: Notion](https://img.shields.io/badge/API-Notion-black.svg)](https://developers.notion.com/)  
[![API: Google Calendar](https://img.shields.io/badge/API-Google%20Calendar-red.svg)](https://developers.google.com/calendar)  

**✨ Notionデータベースと Googleカレンダーを双方向で同期する**  
**🚀 Google Apps Script（GAS）プロジェクト**  

[📋 セットアップ](#️-セットアップ手順) • [🔧 設定](#-設定項目) • [📖 使用方法](#-使用方法) • [🛠️ トラブルシューティング](#️-トラブルシューティング)  

---

</div>  

## ✨ 機能概要

<table align="center">
<tr>
<td width="50%">

### 🔄 同期機能
- **🤖 自動同期**: NotionのScheduleタグが付いたアイテムを自動的にGoogleカレンダーに同期
- **↔️ 双方向同期**: Notionでの変更をカレンダーに反映、削除も同期
- **🛡️ 重複防止**: Event IDによる重複作成防止

</td>
<td width="50%">

### 📅 日付・時刻処理
- **📊 日付範囲対応**: Action Dayの開始日・終了日を取得してカレンダーに反映
- **🌅 終日イベント**: 時刻未設定の日付は終日イベントとして処理
- **⏰ 時刻付きイベント**: 時刻付き日付は適切にスケジュールされたイベントとして処理

</td>
</tr>
<tr>
<td width="50%">

### ⚙️ システム機能
- **🔄 定期実行**: 15分間隔での自動同期（設定変更可能）
- **🛠️ エラーハンドリング**: 詳細なログとエラー処理

</td>
<td width="50%">

### 🎯 対応範囲
- **📈 処理能力**: 1回最大1000件のイベント処理
- **📅 期間**: 過去1ヶ月〜未来3ヶ月の範囲で同期

</td>
</tr>
</table>

## 📊 使用するNotionデータベース

<div align="center">

### 🗃️ データベース構造
![Notionデータベースプロパティ](https://github.com/yusuke-na/SyncNotionGoogleCalendar/blob/main/img/notion-database-property.png?raw=true)

### 🏷️ Scheduleタグ設定  
![NotionのScheduleタグ](https://github.com/yusuke-na/SyncNotionGoogleCalendar/blob/main/img/notion-tags-schedule.png?raw=true)

</div>  

## 🛠️ セットアップ手順

<details>
<summary>📋 <strong>目次</strong> - セットアップ手順一覧</summary>

1. [📋 前提条件](#1--前提条件)
2. [📁 プロジェクトの準備](#2--プロジェクトの準備)
3. [📦 依存関係のインストール](#3--依存関係のインストール)
4. [🔐 Google Apps Script CLIの認証](#4--google-apps-script-cliの認証)
5. [🚀 Google Apps Scriptプロジェクトの作成とデプロイ](#5--google-apps-scriptプロジェクトの作成とデプロイ)
6. [📅 Google Calendar APIの有効化](#6--google-calendar-apiの有効化)
7. [⚙️ スクリプトプロパティの設定](#7--スクリプトプロパティの設定)

</details>

---

### 1. 📋 前提条件

> **必要なツールとアカウント**

- 🟢 **Node.js** (v16以上推奨)
- 📦 **npm**
- 🔐 **Googleアカウント**

### 2. 📁 プロジェクトの準備

1. プロジェクトをクローンまたはダウンロード
2. プロジェクトディレクトリに移動

```bash
cd NotionSyncGoogleGalendar
```

### 3. 📦 依存関係のインストール

```bash
npm ci
```

### 4. 🔐 Google Apps Script CLIの認証

```bash
npm run login
```

> **📝 手順**
> - ブラウザが自動的に開きます
> - Googleアカウントでログイン
> - 必要な権限を許可してください

### 5. 🚀 Google Apps Scriptプロジェクトの作成とデプロイ

<table>  
<tr>  
<td width="50%">  

#### 🆕 新規プロジェクトを作成する場合

```bash
npm run create
```

</td>  
<td width="50%">  

#### 📤 既存プロジェクトにプッシュする場合

```bash
npm run push
```

</td>  
</tr>  
</table>  

### 6. 📅 Google Calendar APIの有効化

> **⚠️ 重要**: 以下のいずれかの方法でAPIを有効化してください

1. **GASエディタから**: 「サービス」→「Google Calendar API」を追加
2. **Google Cloud Consoleから**: [Google Cloud Console](https://console.cloud.google.com/) でCalendar APIを有効化

### 7. ⚙️ スクリプトプロパティの設定

#### 📝 Notion設定手順

1. 🔗 [Notion Developers](https://www.notion.so/my-integrations) でインテグレーションを作成
2. 🔑 APIキーを取得
3. ⚙️ GASエディタで「プロジェクトの設定」→「スクリプト プロパティ」

#### 🗂️ 必要なプロパティ

| キー                    | 説明                                   | 必須 |
| ----------------------- | -------------------------------------- | ---- |
| `NOTION_API_KEY`        | 取得したAPIキー                        | ✅    |
| `NOTION_DATABASE_ID`    | NotionデータベースのID                 | ✅    |
| `NOTION_DATA_SOURCE_ID` | Notionデータソース（コレクション）のID | ✅    |
| `SCHEDULE_TAG_ID`       | ScheduleタグのページID                 | ✅    |
| `CALENDAR_ID`           | 使用するカレンダーID                   | ⚫    |

> **💡 ヒント**: `CALENDAR_ID`未設定の場合は`primary`（メインカレンダー）を使用

### 8. 🔍 Notion IDの取得方法

<details>  
<summary>📱 <strong>NOTION_DATABASE_ID と NOTION_DATA_SOURCE_ID の取得</strong></summary>  

#### 🎯 手順
1. **📂 データベースを開く**: Notionで同期対象のデータベースを開く
2. **🔗 URLを確認**: ブラウザのURL欄を確認
   ```
   https://www.notion.so/workspace/Database-Name-[DATABASE_ID]?v=[VIEW_ID]
   ```
3. **📝 DATABASE_IDをコピー**: `DATABASE_ID`の部分を `NOTION_DATABASE_ID` に設定
4. **🔧 開発者ツールを開く**: F12でNetworkタブを確認
5. **🔎 Collection IDを探す**: API呼び出しで`collection://[COLLECTION_ID]` 形式のIDを探す
6. **📋 COLLECTION_IDをコピー**: `COLLECTION_ID`を `NOTION_DATA_SOURCE_ID` に設定

</details>  

<details>  
<summary>🏷️ <strong>SCHEDULE_TAG_ID の取得</strong></summary>  

#### 🎯 手順
1. **🏷️ Scheduleタグのページを開く**: Notionでタグページにアクセス
2. **🔗 ページIDを取得**: ブラウザのURL欄から取得
   ```
   https://www.notion.so/workspace/Schedule-[PAGE_ID]
   ```
3. **📝 PAGE_IDをコピー**: `PAGE_ID`（ハイフン付き）を `SCHEDULE_TAG_ID` に設定

</details>  

### 9. 🔐 Notion インテグレーションのアクセス設定

> **🔑 権限設定**

1. 🔗 [Notion Developers](https://www.notion.so/my-integrations) で作成したインテグレーションを選択
2. 🔧 「アクセス」→「アクセス権限を編集」
3. ✅ 連携するデータベースを選択

### 10. 🚀 初期設定の実行

```javascript
// GASエディタで以下の関数を実行
initialize();
```

> **✅ 完了**: これで基本的なセットアップが完了です！

## 🔧 設定項目

### ⚙️ コード設定
`main.js` の `CONFIG` オブジェクトで以下の設定が可能：  

```javascript
const CONFIG = {  
   // ... 他の設定
  
  // 🔄 同期設定  
  SYNC_INTERVAL_MINUTES: 15, // 同期間隔（分）  
  MAX_RETRY_COUNT: 3, // API呼び出し失敗時の最大リトライ回数  
  
  // 📝 ログ設定  
  LOG_LEVEL: 'INFO' // DEBUG, INFO, WARN, ERROR  
}; 
```

### 📅 カレンダーID設定

> **💡 設定方法**: スクリプトプロパティで`CALENDAR_ID`を設定することで、使用するカレンダーを変更できます

| 設定値               | 説明                   | 例                                               |
| -------------------- | ---------------------- | ------------------------------------------------ |
| **未設定**           | メインカレンダーを使用 | `'primary'`                                      |
| **メールアドレス**   | 自分のメインカレンダー | `'your-email@gmail.com'`                         |
| **専用カレンダーID** | 特定の専用カレンダー   | `'c_1234567890abcdef@group.calendar.google.com'` |

#### 🔍 専用カレンダーIDの取得方法

<details>  
<summary>📋 <strong>手順</strong></summary>  

1. 🔗 [Googleカレンダー](https://calendar.google.com)を開く
2. 📂 左側のカレンダーリストで対象カレンダーの「⋮」→「設定と共有」
3. ⚙️ 「カレンダーの統合」セクションの「カレンダーID」をコピー
4. 📝 スクリプトプロパティの`CALENDAR_ID`に設定

</details>  

## 📖 使用方法

### 🤖 自動同期

> **⏰ 自動実行**  
> - ✅ 初期設定完了後、15分間隔で自動同期が実行されます  
> - 🏷️ NotionでScheduleタグを付けたアイテムが自動的にカレンダーに追加されます  

### ✋ 手動同期

```javascript
// 手動で同期を実行
manualSync();
```

### 🧪 テスト機能

<table>  
<tr>  
<td width="50%">  

#### 📅 日付処理テスト
```javascript
testDateProcessing();
```

</td>  
<td width="50%">  

#### 🔄 同期機能テスト  
```javascript
testImprovedSync();
```

</td>  
</tr>  
<tr>  
<td colspan="2" align="center">  

#### 🎯 全体テストスイート
```javascript
runAllTests();
```

</td>  
</tr>  
</table>  

### ✅ 同期対象の条件

> **📋 必要な条件**: 以下の条件をすべて満たすアイテムが同期されます

1. **🏷️ Tags**: 「Schedule」が含まれている
2. **📅 Action Day**: 日付が設定されている  
3. **📊 Status**: 「Trash」以外のステータス

## 🗃️ データベース構造

<table>  
<tr>  
<td width="50%">  

### 📋 Notion

| フィールド       | 説明                           | 例                        |
| ---------------- | ------------------------------ | ------------------------- |
| **📝 Title**      | イベントのタイトル             | `重要な会議`              |
| **🏷️ Tags**       | カテゴリタグ（Scheduleを含む） | `Schedule, Work`          |
| **📅 Action Day** | イベントの日付                 | 下記参照                  |
| **📊 Status**     | ステータス                     | `Active`, `Done`, `Trash` |
| **🆔 Event ID**   | Googleカレンダーのイベント ID  | 自動設定                  |
| **🔗 URL**        | 関連URL                        | `https://example.com`     |

#### 📅 Action Day の形式

| 形式     | 例                         | 結果           |
| -------- | -------------------------- | -------------- |
| 日付のみ | `2023-12-25`               | 🌅 終日イベント |
| 時刻付き | `2023-12-25T14:30:00.000Z` | ⏰ 時刻指定     |
| 期間指定 | 開始日〜終了日             | 📊 期間イベント |

</td>  
<td width="50%">  

### 📅 Google Calendar

| 項目            | 設定元       | 説明             |
| --------------- | ------------ | ---------------- |
| **📝 タイトル**  | Notion Title | イベント名       |
| **📅 日付/時刻** | Action Day   | 下記参照         |
| **📄 説明**      | 自動生成     | Notion情報を含む |
| **🎨 色**        | 設定可能     | カレンダーの色   |

#### 📅 日付/時刻の対応

| 条件               | 結果               |
| ------------------ | ------------------ |
| **日付のみ設定**   | 🌅 終日イベント     |
| **時刻が含まれる** | ⏰ 時刻指定イベント |
| **開始日≠終了日**  | 📊 期間イベント     |

</td>  
</tr>  
</table>  

## 🛠️ トラブルシューティング

### 🚨 よくある問題

<details>  
<summary>❌ <strong>同期されない</strong></summary>  

#### 🔍 確認項目
- ✅ **Notion APIキー**: 正しく設定されているか確認
- ✅ **データベース共有**: インテグレーションと共有されているか確認
- ✅ **必須フィールド**: ScheduleタグとAction Dayが設定されているか確認

</details>  

<details>  
<summary>🔒 <strong>権限エラー</strong></summary>  

#### 🔍 確認項目
- ✅ **Google Calendar API**: 有効化されているか確認
- ✅ **GAS実行権限**: 適切な権限が付与されているか確認

</details>  

<details>  
<summary>📅 <strong>カレンダーが見つからないエラー</strong></summary>  

#### 🔍 確認項目
- ✅ **CALENDAR_ID設定**: スクリプトプロパティが正しく設定されているか
- ✅ **カレンダー存在**: 設定したカレンダーIDが存在し、アクセス権限があるか
- 💡 **デフォルト**: 未設定の場合は`primary`（メインカレンダー）を使用

</details>  

<details>  
<summary>🔄 <strong>重複作成</strong></summary>  

#### 🔧 対処法
- ✅ **Event ID確認**: フィールドが正しく更新されているか確認
- 🗑️ **手動リセット**: Event IDをクリアして再同期

</details>  

---

## ⚠️ 制限事項

> **📋 システム制限**

| 項目           | 制限                         |
| -------------- | ---------------------------- |
| **⏰ 同期間隔** | 最短1分                      |
| **📅 同期期間** | 過去1ヶ月〜未来3ヶ月         |
| **📊 処理件数** | 1回最大1000件                |
| **🔄 API制限**  | Notion APIのレート制限に準拠 |

---

## 📜 ライセンス

> **MIT License** 📄  

---

## 🆘 サポート

> **💡 ヒント**: 問題が発生した場合は、実行ログを確認してください。  
> 詳細なエラー情報が記録されています。

<div align="center">

**🎉 Happy Syncing! 🎉**

</div>  
