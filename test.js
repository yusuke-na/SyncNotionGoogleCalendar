/**
 * テスト用関数群
 * 各機能の動作確認とデバッグ用
 */

/**
 * actionDay オブジェクトを読みやすい文字列に変換
 * @param {Object} actionDay - {start: string, end: string} 形式の日付オブジェクト
 * @return {string} 読みやすい日付文字列
 */
function formatActionDay(actionDay) {
  if (!actionDay || !actionDay.start) {
    return '未設定';
  }
  
  if (actionDay.end && actionDay.end !== actionDay.start) {
    return `${actionDay.start} ～ ${actionDay.end}`;
  } else {
    return actionDay.start;
  }
}

/**  
 * Notion API接続テスト
 */  
function testNotionConnection() {  
  Logger.log('=== Notion API接続テスト ===');  
  
  try {  
    // APIキーの確認  
    const apiKey = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');  
    if (!apiKey) {  
      Logger.log('エラー: NOTION_API_KEYが設定されていません');  
      return false;  
    }  
    Logger.log('✓ NOTION_API_KEY設定済み');  
    
    // データベース接続テスト  
    const items = getNotionScheduleItems();  
    Logger.log(`✓ Notionから${items.length}件のアイテムを取得`);  
    
    // 最初の数件を詳細表示
    items.slice(0, 3).forEach((item, index) => {
      Logger.log(`アイテム${index + 1}:`);
      Logger.log(`  タイトル: ${item.title}`);
      Logger.log(`  日付: ${formatActionDay(item.actionDay)}`);
      Logger.log(`  ステータス: ${item.status}`);
      Logger.log(`  Event ID: ${item.eventId || '未設定'}`);
    });
    
    return true;  
    
  } catch (error) {  
    Logger.log(`❌ Notion接続エラー: ${error.message}`);  
    return false;  
  }  
}  

/**  
 * Google Calendar API接続テスト
 */  
function testGoogleCalendarConnection() {  
  Logger.log('=== Google Calendar API接続テスト ===');  
  
  try {  
    // カレンダーリスト取得テスト  
    const calendars = Calendar.CalendarList.list();  
    Logger.log(`✓ ${calendars.items.length}個のカレンダーにアクセス可能`);  
    
    // 全カレンダーの詳細情報表示  
    calendars.items.forEach((calendar, index) => {  
      Logger.log(`カレンダー${index + 1}:`);  
      Logger.log(`  名前: ${calendar.summary}`);  
      Logger.log(`  ID: ${calendar.id}`);  
      Logger.log(`  メインカレンダー: ${calendar.primary ? 'はい' : 'いいえ'}`);  
      Logger.log(`  アクセス権限: ${calendar.accessRole}`);  
      Logger.log(`  タイムゾーン: ${calendar.timeZone || '未設定'}`);  
      Logger.log(`  カラーID: ${calendar.colorId || '未設定'}`);  
      if (calendar.description) {  
        Logger.log(`  説明: ${calendar.description}`);  
      }  
      Logger.log('---');  
    });  
    
    // 既存の同期イベント確認  
    const events = getGoogleCalendarEvents();  
    Logger.log(`✓ 同期対象イベント: ${events.length}件`);  
    
    // 最初の数件を詳細表示  
    events.slice(0, 3).forEach((event, index) => {  
      Logger.log(`イベント${index + 1}:`);  
      Logger.log(`  タイトル: ${event.title}`);  
      Logger.log(`  開始日付: ${event.start}`);  
      Logger.log(`  終了日付: ${event.end}`);  
      Logger.log(`  Notion ID: ${event.notionId || '不明'}`);  
    });  
    
    return true;  
    
  } catch (error) {  
    Logger.log(`❌ Google Calendar接続エラー: ${error.message}`);  
    return false;  
  }  
}  

/**  
 * 同期ロジックテスト（ドライラン）
 */  
function testSyncLogic() {  
  Logger.log('=== 同期ロジックテスト（ドライラン） ===');  
  
  try {  
    // データ取得  
    const notionItems = getNotionScheduleItems();  
    const calendarEvents = getGoogleCalendarEvents();  
    
    Logger.log(`Notionアイテム: ${notionItems.length}件`);  
    Logger.log(`カレンダーイベント: ${calendarEvents.length}件`);  
    
    // マッピング作成  
    const calendarEventMap = new Map();  
    calendarEvents.forEach(event => {  
      if (event.notionId) {  
        calendarEventMap.set(event.notionId, event);  
      }  
    });  
    
    let createCount = 0;  
    let updateCount = 0;  
    let deleteCount = 0;  
    
    // 作成・更新対象の分析  
    notionItems.forEach(notionItem => {  
      const existingEvent = calendarEventMap.get(notionItem.id);  
      
      if (existingEvent) {  
        if (needsUpdate(notionItem, existingEvent)) {  
          Logger.log(`更新対象: ${notionItem.title}`);  
          updateCount++;  
        }  
      } else {
        Logger.log(`作成対象: ${notionItem.title} (${formatActionDay(notionItem.actionDay)})`);
        createCount++;
      }
    });  
    
    // 削除対象の分析  
    const notionIdSet = new Set(notionItems.map(item => item.id));  
    calendarEvents.forEach(event => {  
      if (event.notionId && !notionIdSet.has(event.notionId)) {  
        Logger.log(`削除対象: ${event.title}`);  
        deleteCount++;  
      }  
    });  
    
    Logger.log(`予想される変更: 作成${createCount}件, 更新${updateCount}件, 削除${deleteCount}件`);  
    
    return { createCount, updateCount, deleteCount };  
    
  } catch (error) {  
    Logger.log(`❌ 同期ロジックテストエラー: ${error.message}`);  
    return null;  
  }  
}  

/**  
 * 単一アイテムの同期テスト
 */  
function testSingleItemSync() {  
  Logger.log('=== 単一アイテム同期テスト ===');  
  
  try {  
    const notionItems = getNotionScheduleItems();  
    
    if (notionItems.length === 0) {  
      Logger.log('同期対象のNotionアイテムがありません');  
      return false;  
    }  
    
    // 最初のアイテムでテスト  
    const testItem = notionItems[0];  
    Logger.log(`テスト対象: ${testItem.title}`);  
    
    // カレンダーイベント作成テスト  
    Logger.log('カレンダーイベント作成中...');  
    const eventId = createGoogleCalendarEvent(testItem);  
    
    if (eventId) {  
      Logger.log(`✓ イベント作成成功: ${eventId}`);  
      
      // NotionのEvent ID更新テスト  
      Logger.log('NotionのEvent ID更新中...');  
      updateNotionEventId(testItem.id, eventId);  
      Logger.log('✓ Event ID更新成功');  
      
      // 作成したテストイベントを削除  
      Logger.log('テストイベント削除中...');  
      deleteGoogleCalendarEvent(eventId);  
      Logger.log('✓ テストイベント削除完了');  
      
      return true;  
    } else {  
      Logger.log('❌ イベント作成失敗');  
      return false;  
    }  
    
  } catch (error) {  
    Logger.log(`❌ 単一アイテム同期テストエラー: ${error.message}`);  
    return false;  
  }  
}  

/**  
 * 全体テストスイート実行
 */  
function runAllTests() {  
  Logger.log('=== 全体テストスイート開始 ===');  
  
  const results = {  
    notionConnection: false,  
    calendarConnection: false,  
    syncLogic: false,  
    singleItemSync: false  
  };  
  
  // 各テストを実行  
  results.notionConnection = testNotionConnection();  
  Logger.log('');  
  
  results.calendarConnection = testGoogleCalendarConnection();  
  Logger.log('');  
  
  if (results.notionConnection && results.calendarConnection) {  
    const syncResult = testSyncLogic();  
    results.syncLogic = syncResult !== null;  
    Logger.log('');  
    
    // 単一アイテムテストは慎重に実行  
    const userConfirm = true; // 実際のテスト時は確認を求める  
    if (userConfirm && results.syncLogic) {  
      results.singleItemSync = testSingleItemSync();  
    }  
  }  
  
  // 結果サマリー  
  Logger.log('=== テスト結果サマリー ===');  
  Logger.log(`Notion接続: ${results.notionConnection ? '✓' : '❌'}`);  
  Logger.log(`Calendar接続: ${results.calendarConnection ? '✓' : '❌'}`);  
  Logger.log(`同期ロジック: ${results.syncLogic ? '✓' : '❌'}`);  
  Logger.log(`単一アイテム同期: ${results.singleItemSync ? '✓' : '❌'}`);  
  
  const allPassed = Object.values(results).every(result => result);  
  Logger.log(`総合結果: ${allPassed ? '✓ 全テスト合格' : '❌ 一部テスト失敗'}`);  
  
  return results;  
}  

/**  
 * 設定確認テスト
 */  
function testConfiguration() {  
  Logger.log('=== 設定確認テスト ===');  
  
  // スクリプトプロパティ確認  
  const apiKey = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');  
  Logger.log(`NOTION_API_KEY: ${apiKey ? '設定済み' : '未設定'}`);  
  
  // CONFIG確認  
  Logger.log('CONFIG設定:');  
  Logger.log(`  データベースID: ${CONFIG.NOTION_DATABASE_ID}`);  
  Logger.log(`  データソースID: ${CONFIG.NOTION_DATA_SOURCE_ID}`);  
  Logger.log(`  ScheduleタグID: ${CONFIG.SCHEDULE_TAG_ID}`);  
  Logger.log(`  カレンダーID: ${CONFIG.CALENDAR_ID}`);  
  Logger.log(`  同期間隔: ${CONFIG.SYNC_INTERVAL_MINUTES}分`);  
  
  // トリガー確認  
  const triggers = ScriptApp.getProjectTriggers();  
  const syncTriggers = triggers.filter(trigger =>  
    trigger.getHandlerFunction() === 'syncNotionWithGoogleCalendar'  
  );  
  Logger.log(`同期トリガー: ${syncTriggers.length}個設定済み`);  
  
  return {  
    apiKeySet: !!apiKey,  
    triggerCount: syncTriggers.length  
  };  
}  

/**  
 * デバッグ用：Notionの特定アイテム詳細表示
 */  
function debugNotionItem(itemTitle) {  
  Logger.log(`=== Notionアイテム詳細: ${itemTitle} ===`);  
  
  try {  
    const items = getNotionScheduleItems();  
    const targetItem = items.find(item => item.title.includes(itemTitle));  
    
    if (!targetItem) {  
      Logger.log('指定されたアイテムが見つかりません');  
      return null;  
    }  
    
    Logger.log('アイテム詳細:');  
    Object.entries(targetItem).forEach(([key, value]) => {  
      Logger.log(`  ${key}: ${value}`);  
    });  
    
    return targetItem;  
    
  } catch (error) {  
    Logger.log(`デバッグエラー: ${error.message}`);  
    return null;  
  }  
}  

/**  
 * デバッグ用：カレンダーの特定イベント詳細表示
 */  
function debugCalendarEvent(eventTitle) {  
  Logger.log(`=== カレンダーイベント詳細: ${eventTitle} ===`);  
  
  try {  
    const events = getGoogleCalendarEvents();  
    const targetEvent = events.find(event => event.title.includes(eventTitle));  
    
    if (!targetEvent) {  
      Logger.log('指定されたイベントが見つかりません');  
      return null;  
    }  
    
    Logger.log('イベント詳細:');  
    Object.entries(targetEvent).forEach(([key, value]) => {  
      Logger.log(`  ${key}: ${value}`);  
    });  
    
    return targetEvent;  
    
  } catch (error) {  
    Logger.log(`デバッグエラー: ${error.message}`);  
    return null;  
  }  
}  

/**  
 * 日付処理機能のテスト
 */  
function testDateProcessing() {  
  Logger.log('=== 日付処理機能テスト ===');  
  
  try {  
    // hasTimeComponent 関数のテスト  
    Logger.log('時刻判定テスト:');  
    const testDates = [  
      '2023-12-25',                    // 日付のみ  
      '2023-12-25T14:30:00.000Z',     // 時刻あり（UTC）  
      '2023-12-25T14:30:00',          // 時刻あり（ローカル）  
      null,                           // null値  
      '',                             // 空文字  
    ];  
    
    testDates.forEach(date => {  
      const hasTime = hasTimeComponent(date);  
      Logger.log(`  "${date}" -> ${hasTime ? '時刻あり' : '日付のみ'}`);  
    });  
    
    // createCalendarDateObject 関数のテスト  
    Logger.log('');  
    Logger.log('カレンダー日付オブジェクト作成テスト:');  
    
    // テストケース1: 日付のみ（単日）  
    const dateOnly = { start: '2023-12-25', end: null };  
    const calendarDateOnly = createCalendarDateObject(dateOnly);  
    Logger.log('日付のみ（単日）:');  
    Logger.log(`  開始: ${JSON.stringify(calendarDateOnly.start)}`);  
    Logger.log(`  終了: ${JSON.stringify(calendarDateOnly.end)}`);  
    
    // テストケース2: 日付のみ（期間）  
    const dateRange = { start: '2023-12-25', end: '2023-12-27' };  
    const calendarDateRange = createCalendarDateObject(dateRange);  
    Logger.log('日付のみ（期間）:');  
    Logger.log(`  開始: ${JSON.stringify(calendarDateRange.start)}`);  
    Logger.log(`  終了: ${JSON.stringify(calendarDateRange.end)}`);  
    
    // テストケース3: 時刻あり（単発イベント）  
    const timeOnly = { start: '2023-12-25T14:30:00.000Z', end: null };  
    const calendarTimeOnly = createCalendarDateObject(timeOnly);  
    Logger.log('時刻あり（単発イベント）:');  
    Logger.log(`  開始: ${JSON.stringify(calendarTimeOnly.start)}`);  
    Logger.log(`  終了: ${JSON.stringify(calendarTimeOnly.end)}`);  
    
    // テストケース4: 時刻あり（期間）  
    const timeRange = { start: '2023-12-25T14:30:00.000Z', end: '2023-12-25T16:00:00.000Z' };  
    const calendarTimeRange = createCalendarDateObject(timeRange);  
    Logger.log('時刻あり（期間）:');  
    Logger.log(`  開始: ${JSON.stringify(calendarTimeRange.start)}`);  
    Logger.log(`  終了: ${JSON.stringify(calendarTimeRange.end)}`);  
    
    Logger.log('✓ 日付処理機能テスト完了');  
    return true;  
    
  } catch (error) {  
    Logger.log(`❌ 日付処理機能テストエラー: ${error.message}`);  
    return false;  
  }  
}  

/**  
 * 改善された同期機能のテスト
 */  
function testImprovedSync() {  
  Logger.log('=== 改善された同期機能テスト ===');  
  
  try {  
    // Notionから実際のデータを取得してテスト  
    const notionItems = getNotionScheduleItems();  
    
    if (notionItems.length === 0) {  
      Logger.log('テスト対象のNotionアイテムがありません');  
      return false;  
    }  
    
    Logger.log(`${notionItems.length}件のNotionアイテムを分析中...`);  
    
    notionItems.slice(0, 5).forEach((item, index) => {  
      Logger.log(`アイテム${index + 1}: ${item.title}`);  
      
      if (item.actionDay) {  
        Logger.log(`  開始日: ${item.actionDay.start || '未設定'}`);  
        Logger.log(`  終了日: ${item.actionDay.end || '未設定'}`);  
        
        // 時刻判定テスト  
        if (item.actionDay.start) {  
          const hasTime = hasTimeComponent(item.actionDay.start);  
          Logger.log(`  開始日の時刻: ${hasTime ? 'あり' : 'なし'}`);  
          
          // カレンダー日付オブジェクト作成テスト  
          try {  
            const calendarDate = createCalendarDateObject(item.actionDay);  
            Logger.log(`  カレンダー形式 - 開始: ${JSON.stringify(calendarDate.start)}`);  
            Logger.log(`  カレンダー形式 - 終了: ${JSON.stringify(calendarDate.end)}`);  
          } catch (error) {  
            Logger.log(`  日付変換エラー: ${error.message}`);  
          }  
        }  
      } else {  
        Logger.log('  Action Day: 未設定');  
      }  
      Logger.log('---');  
    });  
    
    Logger.log('✓ 改善された同期機能テスト完了');  
    return true;  
    
  } catch (error) {  
    Logger.log(`❌ 改善された同期機能テストエラー: ${error.message}`);  
    return false;  
  }  
}

/**
 * 重複する[Notion-Sync]イベントをクリーンアップ（再開可能）
 * Googleカレンダーから同一Notion IDの重複イベントを検出し、最新の1件を残して削除する。
 * 1週間ずつ処理し、進捗をScriptPropertiesに保存。タイムアウト時は再実行で続きから処理する。
 */
function cleanupDuplicateEvents() {
  const CHUNK_DAYS = 7;
  const TIME_LIMIT_MS = 5 * 60 * 1000; // 5分で安全に停止（GAS上限6分）
  const startTime = Date.now();
  const props = PropertiesService.getScriptProperties();
  const PROGRESS_KEY = 'CLEANUP_PROGRESS';

  const now = new Date();
  const rangeStart = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000));
  const rangeEnd = new Date(now.getTime() + (180 * 24 * 60 * 60 * 1000));

  // 前回の進捗を復元
  let saved = null;
  try { saved = JSON.parse(props.getProperty(PROGRESS_KEY)); } catch (_) {}
  const resumeFrom = saved ? new Date(saved.nextChunkStart) : rangeStart;
  let totalDuplicates = saved ? saved.totalDuplicates : 0;
  let totalDeleted = saved ? saved.totalDeleted : 0;
  const isResumed = saved !== null;

  if (isResumed) {
    Logger.log(`=== クリーンアップ再開 ===`);
    Logger.log(`前回の進捗: 重複${totalDuplicates}件検出, ${totalDeleted}件削除済, ${resumeFrom.toISOString().split('T')[0]}から再開`);
  } else {
    Logger.log(`=== 重複イベントクリーンアップ開始 ===`);
    Logger.log(`対象範囲: ${rangeStart.toISOString().split('T')[0]} 〜 ${rangeEnd.toISOString().split('T')[0]}`);
  }

  let chunkStart = new Date(resumeFrom);

  try {
    let completed = false;

    while (chunkStart < rangeEnd) {
      if (Date.now() - startTime > TIME_LIMIT_MS) {
        Logger.log(`⏱ 実行時間上限に近づいたため中断します。再実行で続きから処理されます。`);
        props.setProperty(PROGRESS_KEY, JSON.stringify({
          nextChunkStart: chunkStart.toISOString(),
          totalDuplicates, totalDeleted
        }));
        Logger.log(`--- 中間結果 --- 重複: ${totalDuplicates}件, 削除: ${totalDeleted}件`);
        return { totalDuplicates, totalDeleted, completed: false };
      }

      const chunkEnd = new Date(Math.min(
        chunkStart.getTime() + (CHUNK_DAYS * 24 * 60 * 60 * 1000),
        rangeEnd.getTime()
      ));
      Logger.log(`チャンク: ${chunkStart.toISOString().split('T')[0]} 〜 ${chunkEnd.toISOString().split('T')[0]}`);

      // q パラメータでサーバー側フィルタ（[Notion-Sync]イベントのみ取得）
      const FETCH_LIMIT = 750;
      const chunkEvents = [];
      let pageToken = null;
      let pageCount = 0;
      let fetchLimitReached = false;
      do {
        if (chunkEvents.length >= FETCH_LIMIT) {
          fetchLimitReached = true;
          break;
        }
        pageCount++;
        const params = {
          timeMin: chunkStart.toISOString(),
          timeMax: chunkEnd.toISOString(),
          q: '[Notion-Sync]',
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 250
        };
        if (pageToken) params.pageToken = pageToken;
        const response = Calendar.Events.list(CONFIG.CALENDAR_ID, params);
        const fetched = response.items ? response.items.length : 0;
        if (response.items) chunkEvents.push(...response.items);
        pageToken = response.nextPageToken || null;
        Logger.log(`  ページ${pageCount}: ${fetched}件取得 / 累計: ${chunkEvents.length}件${pageToken ? ' (次ページあり)' : ''}`);
      } while (pageToken);

      if (fetchLimitReached) {
        Logger.log(`  取得上限(${FETCH_LIMIT}件)に到達。取得済みイベントで重複処理を実行してから中断します。`);
      }

      // [Notion-Sync]の正確なフィルタ（qは部分一致のため）
      const syncEvents = chunkEvents.filter(e =>
        e.description && e.description.includes('[Notion-Sync]')
      );
      Logger.log(`  取得: ${syncEvents.length}件${fetchLimitReached ? ' (部分取得)' : ''}`);

      // Notion IDでグルーピング
      const groups = new Map();
      syncEvents.forEach(event => {
        const match = event.description.match(/\[Notion-Sync\]\s*Notion ID:\s*([a-f0-9-]+)/);
        if (!match) return;
        const nid = match[1];
        if (!groups.has(nid)) groups.set(nid, []);
        groups.get(nid).push(event);
      });

      // 重複を処理（タイムアウト時も取得済み分は処理する）
      groups.forEach((eventList, notionId) => {
        if (eventList.length <= 1) return;
        eventList.sort((a, b) => new Date(b.updated) - new Date(a.updated));
        const duplicates = eventList.slice(1);
        totalDuplicates += duplicates.length;
        Logger.log(`  ${eventList[0].summary}: ${eventList.length}件 (削除対象: ${duplicates.length})`);

        for (let i = 0; i < duplicates.length; i++) {
          if (Date.now() - startTime > TIME_LIMIT_MS) {
            Logger.log(`⏱ 削除処理中に時間上限に到達。進捗を保存して中断します。`);
            props.setProperty(PROGRESS_KEY, JSON.stringify({
              nextChunkStart: chunkStart.toISOString(),
              totalDuplicates, totalDeleted
            }));
            Logger.log(`--- 中間結果 --- 重複: ${totalDuplicates}件, 削除: ${totalDeleted}件`);
            return { totalDuplicates, totalDeleted, completed: false };
          }
          try {
            Calendar.Events.remove(CONFIG.CALENDAR_ID, duplicates[i].id);
            totalDeleted++;
            Utilities.sleep(200);
          } catch (e) {
            Logger.log(`    削除失敗 (${duplicates[i].id}): ${e.message}`);
            Utilities.sleep(1000);
          }
        }
      });

      // 取得上限到達時は同じチャンクから再開（削除済み分が減るので次回は先に進める）
      if (fetchLimitReached) {
        props.setProperty(PROGRESS_KEY, JSON.stringify({
          nextChunkStart: chunkStart.toISOString(),
          totalDuplicates, totalDeleted
        }));
        Logger.log(`--- 中間結果 --- 重複: ${totalDuplicates}件, 削除: ${totalDeleted}件`);
        return { totalDuplicates, totalDeleted, completed: false };
      }

      chunkStart = chunkEnd;
    }
    completed = true;

    // 完了 → 進捗をクリア
    props.deleteProperty(PROGRESS_KEY);
    Logger.log(`=== 完了 ===`);
    Logger.log(`重複イベント数: ${totalDuplicates}`);
    Logger.log(`削除完了: ${totalDeleted}件`);
    return { totalDuplicates, totalDeleted, completed: true };

  } catch (error) {
    // エラー時も進捗を保存（次回再開可能）
    props.setProperty(PROGRESS_KEY, JSON.stringify({
      nextChunkStart: chunkStart.toISOString(),
      totalDuplicates, totalDeleted
    }));
    Logger.log(`❌ エラー発生（進捗は保存済み、再実行で続行可能）: ${error.message}`);
    throw error;
  }
}

/**
 * クリーンアップの進捗をリセット（最初からやり直す場合に使用）
 */
function resetCleanupProgress() {
  PropertiesService.getScriptProperties().deleteProperty('CLEANUP_PROGRESS');
  Logger.log('クリーンアップの進捗をリセットしました');
}  
