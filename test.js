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
