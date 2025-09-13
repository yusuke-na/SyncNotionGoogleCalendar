# Sync Notion-GoogleCalendar

Notionのデータベースと、Googleカレンダーを双方向で同期するGoogle Apps Script（GAS）プロジェクトです。  

## 機能概要

- **自動同期**: NotionのScheduleタグが付いたアイテムを自動的にGoogleカレンダーに同期
- **双方向同期**: Notionでの変更をカレンダーに反映、削除も同期
- **日付範囲対応**: Action Dayの開始日・終了日を取得してカレンダーに反映
- **終日イベント対応**: 時刻が設定されていない日付は自動的に終日イベントとして処理
- **時刻付きイベント対応**: 時刻が含まれる日付は適切にスケジュールされたイベントとして処理
- **定期実行**: 15分間隔での自動同期（設定変更可能）
- **重複防止**: Event IDによる重複作成防止
- **エラーハンドリング**: 詳細なログとエラー処理

## セットアップ手順

### 1. 前提条件

- Node.js (v16以上推奨)
- npm
- Googleアカウント

### 2. プロジェクトの準備

1. プロジェクトをクローンまたはダウンロード
2. プロジェクトディレクトリに移動
```bash
cd NotionSyncGoogleGalendar
```

### 3. 依存関係のインストール

```bash
npm ci
```

### 4. Google Apps Script CLIの認証

```bash
npm run login
```
- ブラウザが開くので、Googleアカウントでログイン
- 必要な権限を許可

### 5. Google Apps Scriptプロジェクトの作成とデプロイ

#### 新規プロジェクトを作成する場合
```bash
npm run create
```

#### 既存プロジェクトにプッシュする場合
```bash
npm run push
```

### 6. Google Calendar APIの有効化

1. GASエディタで「サービス」→「Google Calendar API」を追加
2. または [Google Cloud Console](https://console.cloud.google.com/) でCalendar APIを有効化

### 7. スクリプトプロパティの設定

1. [Notion Developers](https://www.notion.so/my-integrations) でインテグレーションを作成
2. APIキーを取得
3. GASエディタで「プロジェクトの設定」→「スクリプト プロパティ」
4. 以下のプロパティを追加：
   - キー: `NOTION_API_KEY`
   - 値: 取得したAPIキー
   - キー: `NOTION_DATABASE_ID`
   - 値: NotionデータベースのID
   - キー: `NOTION_DATA_SOURCE_ID`
   - 値: Notionデータソース（コレクション）のID
   - キー: `SCHEDULE_TAG_ID`
   - 値: ScheduleタグのページID
   - キー: `CALENDAR_ID`（任意）
   - 値: 使用するカレンダーID（未設定の場合は`primary`を使用）

### 8. Notion IDの取得方法

#### NOTION_DATABASE_ID と NOTION_DATA_SOURCE_ID の取得
1. Notionで同期対象のデータベースを開く
2. ブラウザのURL欄を確認：`https://www.notion.so/workspace/Database-Name-[DATABASE_ID]?v=[VIEW_ID]`
3. DATABASE_IDの部分をコピーして `NOTION_DATABASE_ID` に設定
4. NotionのデータベースページでF12（開発者ツール）を開く
5. NetworkタブでAPI呼び出しを確認し、`collection://[COLLECTION_ID]` 形式のIDを探す
6. COLLECTION_IDの部分をコピーして `NOTION_DATA_SOURCE_ID` に設定

#### SCHEDULE_TAG_ID の取得
1. NotionでScheduleタグのページを開く
2. ブラウザのURL欄からページIDを取得：`https://www.notion.so/workspace/Schedule-[PAGE_ID]`
3. PAGE_IDの部分（ハイフン付き）をコピーして `SCHEDULE_TAG_ID` に設定

### 9. Notion インテグレーションのアクセス設定

1. [Notion Developers](https://www.notion.so/my-integrations) で作成したインテグレーションを選択
2. 「アクセス」→「アクセス権限を編集」
3. 連携するデータベースを選択

### 10. 初期設定の実行

```javascript
// GASエディタで以下の関数を実行
initialize();
```

## 設定項目

### コード設定
`main.js` の `CONFIG` オブジェクトで以下の設定が可能：  

```javascript
const CONFIG = {  
   ...
  
  // 同期設定  
  SYNC_INTERVAL_MINUTES: 15, // 同期間隔（分）  
  MAX_RETRY_COUNT: 3, // API呼び出し失敗時の最大リトライ回数  
  
  // ログ設定  
  LOG_LEVEL: 'INFO' // DEBUG, INFO, WARN, ERROR  
}; 
```

### カレンダーID設定
スクリプトプロパティで`CALENDAR_ID`を設定することで、使用するカレンダーを変更できます：  

- **未設定** → `'primary'`（メインカレンダー）を使用
- **メールアドレス** → `'your-email@gmail.com'`（自分のメインカレンダー）
- **専用カレンダーID** → `'c_1234567890abcdef@group.calendar.google.com'`（専用カレンダー）

#### 専用カレンダーIDの取得方法
1. [Googleカレンダー](https://calendar.google.com)を開く
2. 左側のカレンダーリストで対象カレンダーの「⋮」→「設定と共有」
3. 「カレンダーの統合」セクションの「カレンダーID」をコピー
4. スクリプトプロパティの`CALENDAR_ID`に設定

## 使用方法

### 自動同期
- 初期設定完了後、15分間隔で自動同期が実行されます
- NotionでScheduleタグを付けたアイテムが自動的にカレンダーに追加されます

### 手動同期
```javascript
// 手動で同期を実行
manualSync();
```

### テスト機能
```javascript
// 新しい日付処理機能のテスト
testDateProcessing();

// 改善された同期機能のテスト
testImprovedSync();

// 全体テストスイート実行
runAllTests();
```

### 同期対象の条件
1. **Tags**に「Schedule」が含まれている
2. **Action Day**が設定されている
3. **Status**が「Trash」以外

## データベース構造

### Notion
- **Title**: イベントのタイトル
- **Tags**: カテゴリタグ（Scheduleを含む）
- **Action Day**: イベントの日付（開始日・終了日対応）
  - 日付のみ: `2023-12-25` → 終日イベント
  - 時刻付き: `2023-12-25T14:30:00.000Z` → 時刻指定イベント
  - 期間指定: 開始日と終了日の両方を設定可能
- **Status**: ステータス（Active, Done, Trash, None）
- **Event ID**: Googleカレンダーのイベント ID（自動設定）
- **URL**: 関連URL（任意）

### Google Calendar
- **タイトル**: NotionのTitleから設定
- **日付/時刻**: NotionのAction Dayから設定
  - 終日イベント: 日付のみが設定されている場合
  - 時刻指定イベント: 時刻が含まれている場合
  - 期間イベント: 開始日と終了日が異なる場合
- **説明**: Notion情報を含む自動生成テキスト
- **色**: カレンダーの色（設定変更可能）

## トラブルシューティング

### よくある問題

1. **同期されない**
   - Notion APIキーが正しく設定されているか確認
   - データベースがインテグレーションと共有されているか確認
   - ScheduleタグとAction Dayが設定されているか確認

2. **権限エラー**
   - Google Calendar APIが有効化されているか確認
   - GASの実行権限を確認

3. **カレンダーが見つからないエラー**
   - `CALENDAR_ID`スクリプトプロパティが正しく設定されているか確認
   - 設定したカレンダーIDが存在し、アクセス権限があるか確認
   - 未設定の場合は`primary`（メインカレンダー）が使用される

4. **重複作成**
   - Event IDフィールドが正しく更新されているか確認
   - 手動でEvent IDをクリアして再同期


## 制限事項

- 同期間隔は最短1分
- 過去1ヶ月〜未来3ヶ月の範囲で同期
- 1回の実行で最大1000件のイベントを処理
- Notion APIのレート制限に準拠

## ライセンス

MIT License  

## サポート

問題が発生した場合は、実行ログを確認してください。詳細なエラー情報が記録されています。  
