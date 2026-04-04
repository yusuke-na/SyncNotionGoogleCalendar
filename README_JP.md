<div align="center">  

# Sync Notion-GoogleCalendar

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Language: JavaScript](https://img.shields.io/badge/Language-JavaScript-f1e05a.svg)](https://github.com/yusuke-na/SyncNotionGoogleCalendar) [![Platform: Google Apps Script](https://img.shields.io/badge/Platform-Google%20Apps%20Script-blue.svg)](https://developers.google.com/apps-script) [![API: Notion](https://img.shields.io/badge/API-Notion-black.svg)](https://developers.notion.com/) [![API: Google Calendar](https://img.shields.io/badge/API-Google%20Calendar-red.svg)](https://developers.google.com/calendar)  

**NotionデータベースとGoogleカレンダーを双方向で同期するGoogle Apps Scriptプロジェクトです。**  
**Notionで管理しているタスクやスケジュールを自動的にGoogleカレンダーに反映させることができます。**  

</div>  

## ✨ 機能概要

- **🔄 自動同期**: NotionのScheduleタグが付いたアイテムを15分間隔でGoogleカレンダーに自動同期
- **📅 日付処理**: 終日イベント・時刻指定イベント・期間イベントに対応
- **🛡️ 重複防止**: Event IDによる重複作成を防止
- **↔️ 双方向同期**: Notionでの変更・削除をカレンダーに反映

## 🚀 セットアップ

### 1️⃣ 前提条件
- Node.js (v16以降)
- npm
- Googleアカウント
- Notionアカウント

### 2️⃣ Notion APIの設定

#### Notionインテグレーションの作成
1. [Notion Developers](https://www.notion.so/my-integrations) にアクセス
2. **「+ New integration」** をクリック
3. インテグレーション名を入力（例：`GoogleCalendar-Sync`）
4. **「Submit」** をクリック
5. **Internal Integration Token** をコピーして保存

#### データベース情報の取得
1. 同期対象のNotionデータベースを開く
2. URLから**データベースID**を取得
   - `https://notion.so/workspace/{database-id}?v={view-id}`
   - `{database-id}` の部分がデータベースID
3. **「Scheduleタグ」のページID**を取得
   - Scheduleタグをクリック → URLからページIDを取得

#### データベースの共有設定
1. データベースの右上「⋯」→「Add connections」
2. 作成したインテグレーションを選択して追加

### 3️⃣ Google APIs の設定

#### Google Cloud Console での設定
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存プロジェクトを選択
3. **Google Calendar API** を有効化
   - 「APIとサービス」→「ライブラリ」
   - 「Google Calendar API」を検索して有効化
4. **Google Apps Script API** を有効化
   - 同様の手順で有効化

### 4️⃣ npmとclaspによるGoogle Apps Scriptプロジェクトの構築

#### claspのインストールと認証
```bash
# プロジェクトフォルダに移動
cd SyncNotionGoogleCalendar

# 依存関係のインストール
npm install

# claspでGoogleアカウントにログイン
npm run login
```

#### Google Apps Scriptプロジェクトの作成とデプロイ
```bash
# 新しいGASプロジェクトを作成（初回のみ）
npm run create

# コードをGoogle Apps Scriptにプッシュ
npm run push
```

### 5️⃣ Google Apps Script の設定

#### スクリプトプロパティの設定
1. [Google Apps Script](https://script.google.com/) にアクセス
2. 作成したプロジェクトを開く
3. 左メニュー「プロジェクトの設定」→「スクリプト プロパティ」
4. 以下のプロパティを追加：

| プロパティ名         | 値                                 | 説明                               |
| -------------------- | ---------------------------------- | ---------------------------------- |
| `NOTION_API_KEY`     | `secret_xxxxx...`                  | NotionのInternal Integration Token |
| `NOTION_DATABASE_ID` | `xxxxxxxxx...`                     | 同期対象のNotionデータベースID     |
| `SCHEDULE_TAG_ID`    | `xxxxxxxxx...`                     | 「Schedule」タグのページID         |
| `CALENDAR_ID`        | `primary` または特定のカレンダーID | 同期先のGoogleカレンダー（省略可） |

#### 必要なAPIサービスの有効化
1. 左メニュー「サービス」
2. **Google Calendar API** を有効化（v3を選択）

### 6️⃣ Notionデータベースの構成

同期を正常に動作させるために、Notionデータベースに以下のプロパティが必要です：  

| プロパティ名   | タイプ       | 必須 | 説明                                     |
| -------------- | ------------ | ---- | ---------------------------------------- |
| **Title**      | タイトル     | ✅    | イベントのタイトル                       |
| **Action Day** | 日付         | ✅    | イベントの日時                           |
| **Tags**       | リレーション | ✅    | 「Schedule」タグを含むリレーション       |
| **Status**     | ステータス   | ❌    | タスクのステータス                       |
| **Event ID**   | テキスト     | ❌    | GoogleカレンダーのイベントID（自動設定） |
| **URL**        | URL          | ❌    | 関連リンク                               |

## 📖 使い方

### 1️⃣ 初期設定の実行

Google Apps Scriptエディタで初期設定を実行：  

```javascript
// 初期設定関数を実行（初回のみ）
initialize();
```

この関数は以下の処理を行います：  
- スクリプトプロパティの確認
- Google Calendar APIの接続テスト
- 自動同期トリガーの設定（15分間隔）

### 2️⃣ Notionでのスケジュール管理

#### スケジュールアイテムの作成
1. Notionデータベースに新しいページを作成
2. **Title**にイベント名を入力
3. **Action Day**に日時を設定：
   - **終日イベント**: 日付のみ（例：`2023-12-25`）
   - **時間指定**: 日時を指定（例：`2023-12-25 14:30`）
   - **期間指定**: 開始日時と終了日時を設定
4. **Tags**に「Schedule」タグを追加

#### 同期対象の条件
- ✅ `Tags`に「Schedule」タグが含まれている
- ✅ `Action Day`が設定されている
- ✅ `Action Day`が同期範囲内（過去30日〜未来90日）である
- ❌ 上記を満たさないアイテムは同期対象外

### 3️⃣ 自動同期の動作

#### 同期タイミング
- **自動同期**: 15分間隔で実行
- **手動同期**: Google Apps Scriptエディタで`manualSync()`を実行

#### 同期される操作
| Notion操作         | Googleカレンダー |
| ------------------ | ---------------- |
| 📝 新規作成         | ➕ イベント作成   |
| ✏️ タイトル変更     | 🔄 イベント更新   |
| 📅 日時変更         | 🔄 イベント更新   |
| ❌ Scheduleタグ削除 | 🗑️ イベント削除   |
| 🗑️ ページ削除       | 🗑️ イベント削除   |

### 4️⃣ イベント形式の例

#### 終日イベント
```
Title: 会議の準備
Action Day: 2023-12-25
→ Googleカレンダー: 12/25 終日イベント
```

#### 時間指定イベント
```
Title: チームミーティング
Action Day: 2023-12-25 14:00 → 2023-12-25 15:30
→ Googleカレンダー: 12/25 14:00-15:30
```

#### 複数日イベント
```
Title: 出張
Action Day: 2023-12-25 → 2023-12-27
→ Googleカレンダー: 12/25-12/27 終日イベント
```

### 5️⃣ 同期状態の確認

#### Event IDでの追跡
- 同期されたNotionページには**Event ID**が自動設定
- このIDでGoogleカレンダーとの紐付けを管理
- Event IDがあるページは既に同期済み

#### 同期ログの確認
Google Apps Scriptエディタの実行ログで同期状況を確認：  
```
=== 同期処理開始 ===
Notionから3件のスケジュールアイテムを取得
Googleカレンダーから5件のイベントを取得
=== 同期処理完了 ===
作成: 1, 更新: 1, 削除: 0
```  

## 🔧 トラブルシューティング

### ❌ よくあるエラーと解決方法

#### 1. **Notion API接続エラー**
```
エラー: Notion API エラー (401): Unauthorized
```

**原因と解決方法:**  
- ❌ **NOTION_API_KEY** が正しく設定されていない
  - ✅ Notion Developersで取得したInternal Integration Tokenを確認
  - ✅ Google Apps Scriptのスクリプトプロパティで正しく設定
- ❌ データベースにインテグレーションが追加されていない
  - ✅ Notionデータベース → 「⋯」→ 「Add connections」でインテグレーションを追加

#### 2. **スケジュールアイテムが取得できない**
```
ログ: Notionから0件のスケジュールアイテムを取得
```

**原因と解決方法:**  
- ❌ **SCHEDULE_TAG_ID** が間違っている
  - ✅ 「Schedule」タグのページを開き、URLからページIDを確認
  - ✅ ページIDはハイフンを含む32文字の文字列
- ❌ データベース内に「Schedule」タグ付きアイテムがない
  - ✅ Notionでアイテムを作成し、「Schedule」タグを追加
  - ✅ Action Dayも設定されているか確認

#### 3. **Google Calendar API接続エラー**
```
エラー: Google Calendar APIが有効化されていません
```

**原因と解決方法:**  
- ❌ Google Apps ScriptでCalendar APIが有効化されていない
  - ✅ Google Apps Script → 「サービス」→ Google Calendar API v3を追加
- ❌ Google Cloud ConsoleでCalendar APIが無効
  - ✅ Google Cloud Console → APIとサービス → ライブラリ → Google Calendar APIを有効化

#### 4. **同期が実行されない**
```
ログ: トリガーが設定されていません
```

**原因と解決方法:**  
- ❌ 定期実行トリガーが設定されていない
  - ✅ Google Apps Script → トリガー → `syncNotionWithGoogleCalendar`関数の15分間隔トリガーを確認
  - ✅ または`initialize()`関数を実行してトリガーを自動設定

#### 5. **日付形式エラー**
```
エラー: 有効なAction Dayが設定されていません
```

**原因と解決方法:**  
- ❌ Notion の Action Day プロパティが空
  - ✅ NotionでAction Dayに適切な日付を設定
- ❌ Action Day の形式が正しくない
  - ✅ 終日: `2023-12-25`
  - ✅ 時間指定: `2023-12-25T14:30:00`
  - ✅ 期間: 開始日 → 終了日で設定

#### 6. **権限エラー**
```
エラー: Insufficient permissions
```

**原因と解決方法:**  
- ❌ Google Apps ScriptでCalendarスコープが不足
  - ✅ スクリプト実行時に必要な権限を承認
  - ✅ 「承認が必要です」の画面で「権限を確認」をクリック

#### 7. **Calendar usage limits exceededエラー**
```
エラー: API call to calendar.events.insert failed with error: Calendar usage limits exceeded.
```

**原因と解決方法:**  
- ❌ 同期範囲外のイベントが繰り返し作成され、Google Calendar APIのクォータを超過
  - ✅ `cleanupDuplicateEvents()` を実行して重複イベントを削除（完了まで繰り返し実行）
  - ✅ 最新バージョンに更新して日付範囲フィルターの修正を適用

### 🔍 デバッグ方法

#### ログの確認
1. Google Apps Script → 「実行」→ 任意の関数を実行
2. 「実行ログ」でエラー内容を確認
3. 詳細なデバッグには `Logger.log()` を追加

#### 手動テスト
```javascript
// 個別機能のテスト
function testNotionConnection() {
  const items = getNotionScheduleItems();
  Logger.log(`取得したアイテム数: ${items.length}`);
  items.forEach(item => Logger.log(item.title));
}

function testCalendarConnection() {
  const events = getGoogleCalendarEvents();
  Logger.log(`取得したイベント数: ${events.length}`);
}
```

#### 設定値の確認
```javascript
function checkConfiguration() {
  const config = {
    apiKey: CONFIG.NOTION_API_KEY ? '設定済み' : '未設定',
    databaseId: CONFIG.NOTION_DATABASE_ID ? '設定済み' : '未設定',
    scheduleTagId: CONFIG.SCHEDULE_TAG_ID ? '設定済み' : '未設定'
  };
  Logger.log(config);
}
```

#### 重複イベントのクリーンアップ
```javascript
// 重複イベントの検出・削除（再開可能、完了まで繰り返し実行）
cleanupDuplicateEvents();

// 進捗をリセットして最初からやり直す場合
resetCleanupProgress();
```

### ⚠️ 注意事項

- **レート制限**: Notion APIは1秒間に最大3リクエスト
- **タイムゾーン**: デフォルトで`Asia/Tokyo`に設定
- **同期範囲**: 過去30日〜未来90日のイベントのみ対象
- **重複防止**: Event IDによる紐付けで重複作成を防止  

## 🗃️ このプロジェクトで使用するNotionデータベース項目

![Notionデータベースプロパティ](https://github.com/yusuke-na/SyncNotionGoogleCalendar/blob/main/img/notion-database-property.png?raw=true)  
![NotionのScheduleタグ](https://github.com/yusuke-na/SyncNotionGoogleCalendar/blob/main/img/notion-tags-schedule.png?raw=true)  

## 📄 ライセンス

このプロジェクトは **[MIT License](https://github.com/yusuke-na/SyncNotionGoogleCalendar/blob/main/LICENSE)** の下でライセンスされています。   

### 🤝 コントリビューション

このプロジェクトへのコントリビューションを歓迎します！  
- 🐛 バグ報告
- 💡 機能提案  
- 🔧 プルリクエスト

詳細は [GitHub Issues](https://github.com/yusuke-na/SyncNotionGoogleCalendar/issues) でお気軽にお知らせください。  
