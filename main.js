/**  
 * NotionとGoogleカレンダーの双方向同期スクリプト
 *  
 * 機能:
 * - NotionのINBOX-Lifeデータベースの「Schedule」タグ付きアイテムをGoogleカレンダーに同期
 * - Action Dayをカレンダーの日付として使用
 * - 双方向での作成、更新、削除の同期
 */  

// 設定定数  
const CONFIG = {  
  // Notion設定  
  NOTION_API_KEY: PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY'),  
  NOTION_DATABASE_ID: PropertiesService.getScriptProperties().getProperty('NOTION_DATABASE_ID'),  
  NOTION_DATA_SOURCE_ID: PropertiesService.getScriptProperties().getProperty('NOTION_DATA_SOURCE_ID'),  
  SCHEDULE_TAG_ID: PropertiesService.getScriptProperties().getProperty('SCHEDULE_TAG_ID'), // Scheduleタグのページ ID  
  
  // Google Calendar設定  
  CALENDAR_ID: PropertiesService.getScriptProperties().getProperty('CALENDAR_ID') || 'primary', // メインカレンダー、必要に応じて変更  
  
  // 同期設定  
  SYNC_INTERVAL_MINUTES: 15, // 同期間隔（分）  
  MAX_RETRY_COUNT: 3, // API呼び出し失敗時の最大リトライ回数  
  
  // ログ設定  
  LOG_LEVEL: 'INFO' // DEBUG, INFO, WARN, ERROR  
};  

/**  
 * メイン同期関数
 * 定期実行トリガーから呼び出される
 */  
function syncNotionWithGoogleCalendar() {  
  try {  
    Logger.log('=== 同期処理開始 ===');  
    
    // 1. Notionから同期対象データを取得  
    const notionItems = getNotionScheduleItems();  
    Logger.log(`Notionから${notionItems.length}件のスケジュールアイテムを取得`);  
    
    // 2. Googleカレンダーから既存イベントを取得  
    const calendarEvents = getGoogleCalendarEvents();  
    Logger.log(`Googleカレンダーから${calendarEvents.length}件のイベントを取得`);  
    
    // 3. 同期処理実行  
    const syncResult = performSync(notionItems, calendarEvents);  
    
    Logger.log(`=== 同期処理完了 ===`);  
    Logger.log(`作成: ${syncResult.created}, 更新: ${syncResult.updated}, 削除: ${syncResult.deleted}`);  
    
    return syncResult;  
    
  } catch (error) {  
    Logger.log(`同期処理でエラーが発生: ${error.message}`);  
    Logger.log(error.stack);  
    throw error;  
  }  
}  

/**  
 * Notionから同期対象のスケジュールアイテムを取得
 */  
function getNotionScheduleItems() {  
  try {  
    // デバッグログ追加
    Logger.log(`SCHEDULE_TAG_ID: ${CONFIG.SCHEDULE_TAG_ID}`);
    Logger.log(`DATABASE_ID: ${CONFIG.NOTION_DATABASE_ID}`);
    
    const url = `https://api.notion.com/v1/databases/${CONFIG.NOTION_DATABASE_ID}/query`;  
    
    // まずrelationタイプで試行
    const payload = {  
      filter: {  
        and: [  
          {  
            property: 'Tags',  
            relation: {  
              contains: CONFIG.SCHEDULE_TAG_ID
            }  
          },  
          {  
            property: 'Action Day',  
            date: {  
              is_not_empty: true  
            }  
          }  
        ]  
      },  
      sorts: [  
        {  
          property: 'Update At',  
          direction: 'descending'  
        }  
      ]  
    };  
    
    const options = {  
      method: 'POST',  
      headers: {  
        'Authorization': `Bearer ${CONFIG.NOTION_API_KEY}`,  
        'Content-Type': 'application/json',  
        'Notion-Version': '2022-06-28'  
      },  
      payload: JSON.stringify(payload),
      muteHttpExceptions: true  
    };  
    
    const response = UrlFetchApp.fetch(url, options);  
    const data = JSON.parse(response.getContentText());  
    
    if (response.getResponseCode() !== 200) {  
      Logger.log(`完全なエラーレスポンス: ${response.getContentText()}`);
      throw new Error(`Notion API エラー (${response.getResponseCode()}): ${data.message || 'Unknown error'}`);  
    }  
    
    return data.results.map(item => ({  
      id: item.id,  
      title: getPropertyValue(item.properties, 'Title'),  
      actionDay: getPropertyValue(item.properties, 'Action Day'),  
      status: getPropertyValue(item.properties, 'Status'),  
      eventId: getPropertyValue(item.properties, 'Event ID'),  
      url: getPropertyValue(item.properties, 'URL'),  
      lastEditedTime: item.last_edited_time  
    }));  
    
  } catch (error) {  
    Logger.log(`Notionデータ取得エラー: ${error.message}`);  
    throw error;  
  }  
}  

/**  
 * Notionプロパティから値を取得するヘルパー関数
 */  
function getPropertyValue(properties, propertyName) {  
  const property = properties[propertyName];  
  if (!property) return null;  
  
  switch (property.type) {  
    case 'title':
      return property.title?.[0]?.plain_text || '';  
    case 'rich_text':
      return property.rich_text?.[0]?.plain_text || '';  
    case 'date':
      // 日付プロパティの場合は開始日と終了日の両方を含むオブジェクトを返す
      return {
        start: property.date?.start || null,
        end: property.date?.end || null
      };  
    case 'status':
      return property.status?.name || null;  
    case 'url':
      return property.url || null;  
    default:
      return null;  
  }  
}  

/**  
 * Googleカレンダーから既存イベントを取得
 */  
function getGoogleCalendarEvents() {  
  try {  
    const now = new Date();  
    const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));  
    const threeMonthLater = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));  
    
    const events = Calendar.Events.list(CONFIG.CALENDAR_ID, {  
      timeMin: oneMonthAgo.toISOString(),  
      timeMax: threeMonthLater.toISOString(),  
      singleEvents: true,  
      orderBy: 'startTime',  
      maxResults: 1000  
    });  
    
    return events.items.filter(event =>  
      event.description && event.description.includes('[Notion-Sync]')  
    ).map(event => ({  
      id: event.id,  
      title: event.summary,  
      start: event.start.date || event.start.dateTime,  
      end: event.end.date || event.end.dateTime,  
      description: event.description,  
      updated: event.updated,  
      notionId: extractNotionIdFromDescription(event.description)  
    }));  
    
  } catch (error) {  
    Logger.log(`Googleカレンダーデータ取得エラー: ${error.message}`);  
    throw error;  
  }  
}  

/**  
 * イベント説明からNotion IDを抽出
 */  
function extractNotionIdFromDescription(description) {  
  const match = description.match(/\[Notion-Sync\]\s*Notion ID:\s*([a-f0-9-]+)/);  
  return match ? match[1] : null;  
}

/**
 * 日付文字列に時刻が含まれているかを判定
 * @param {string} dateString - ISO 8601形式の日付文字列
 * @return {boolean} 時刻が含まれている場合true、日付のみの場合false
 */
function hasTimeComponent(dateString) {
  if (!dateString) return false;
  
  // ISO 8601形式で時刻が含まれている場合は 'T' が含まれる
  // 例: "2023-12-25T14:30:00.000Z" (時刻あり) vs "2023-12-25" (日付のみ)
  return dateString.includes('T');
}

/**
 * Notionの日付データから適切なGoogleカレンダーの日付オブジェクトを作成
 * @param {Object} actionDay - Notionの日付オブジェクト {start: string, end: string}
 * @return {Object} Googleカレンダー用の日付オブジェクト
 */
function createCalendarDateObject(actionDay) {
  if (!actionDay || !actionDay.start) {
    throw new Error('有効なAction Dayが設定されていません');
  }

  const hasStartTime = hasTimeComponent(actionDay.start);
  const hasEndTime = actionDay.end ? hasTimeComponent(actionDay.end) : false;
  
  // 開始日の設定
  const startDate = {};
  if (hasStartTime) {
    startDate.dateTime = actionDay.start;
    startDate.timeZone = 'Asia/Tokyo'; // 必要に応じて調整
  } else {
    startDate.date = actionDay.start;
  }
  
  // 終了日の設定
  const endDate = {};
  if (actionDay.end) {
    // 明示的な終了日がある場合
    if (hasEndTime) {
      endDate.dateTime = actionDay.end;
      endDate.timeZone = 'Asia/Tokyo'; // 必要に応じて調整
    } else {
      // 終日イベントの場合、終了日は次の日にする必要がある
      const endDateObj = new Date(actionDay.end);
      endDateObj.setDate(endDateObj.getDate() + 1);
      endDate.date = endDateObj.toISOString().split('T')[0];
    }
  } else {
    // 終了日が設定されていない場合は開始日と同じに設定
    if (hasStartTime) {
      endDate.dateTime = actionDay.start;
      endDate.timeZone = 'Asia/Tokyo';
    } else {
      // 終日イベントの場合、終了日は次の日にする必要がある
      const endDateObj = new Date(actionDay.start);
      endDateObj.setDate(endDateObj.getDate() + 1);
      endDate.date = endDateObj.toISOString().split('T')[0];
    }
  }
  
  return { start: startDate, end: endDate };
}  

/**  
 * 同期処理を実行
 */  
function performSync(notionItems, calendarEvents) {  
  const result = { created: 0, updated: 0, deleted: 0 };  
  
  // Notion ID をキーとしたマップを作成  
  const calendarEventMap = new Map();  
  calendarEvents.forEach(event => {  
    if (event.notionId) {  
      calendarEventMap.set(event.notionId, event);  
    }  
  });  
  
  // 1. Notionアイテムを処理（作成・更新）  
  notionItems.forEach(notionItem => {  
    try {  
      const existingEvent = calendarEventMap.get(notionItem.id);  
      
      if (existingEvent) {  
        // 更新が必要かチェック  
        if (needsUpdate(notionItem, existingEvent)) {  
          updateGoogleCalendarEvent(existingEvent.id, notionItem);  
          result.updated++;  
        }  
      } else {  
        // 新規作成  
        const eventId = createGoogleCalendarEvent(notionItem);  
        if (eventId) {  
          updateNotionEventId(notionItem.id, eventId);  
          result.created++;  
        }  
      }  
    } catch (error) {  
      Logger.log(`アイテム処理エラー (${notionItem.title}): ${error.message}`);  
    }  
  });  
  
  // 2. 削除されたNotionアイテムに対応するカレンダーイベントを削除  
  const notionIdSet = new Set(notionItems.map(item => item.id));  
  calendarEvents.forEach(event => {  
    if (event.notionId && !notionIdSet.has(event.notionId)) {  
      try {  
        deleteGoogleCalendarEvent(event.id);  
        result.deleted++;  
      } catch (error) {  
        Logger.log(`イベント削除エラー (${event.title}): ${error.message}`);  
      }  
    }  
  });  
  
  return result;  
}  

/**  
 * 更新が必要かどうかをチェック
 */  
function needsUpdate(notionItem, calendarEvent) {  
  // タイトルの比較  
  if (notionItem.title !== calendarEvent.title) {  
    return true;  
  }  
  
  // 日付の比較
  if (notionItem.actionDay && notionItem.actionDay.start) {
    // Notion側の開始日
    const notionStartDate = hasTimeComponent(notionItem.actionDay.start)
      ? new Date(notionItem.actionDay.start)
      : new Date(notionItem.actionDay.start + 'T00:00:00');
    
    // カレンダー側の開始日
    const calendarStartDate = calendarEvent.start.includes('T')
      ? new Date(calendarEvent.start)
      : new Date(calendarEvent.start + 'T00:00:00');
    
    // 開始日の比較（日付レベルで比較）
    if (notionStartDate.toDateString() !== calendarStartDate.toDateString()) {
      return true;
    }
    
    // 終了日がある場合の比較
    if (notionItem.actionDay.end) {
      const notionEndDate = hasTimeComponent(notionItem.actionDay.end)
        ? new Date(notionItem.actionDay.end)
        : new Date(notionItem.actionDay.end + 'T00:00:00');
      
      const calendarEndDate = calendarEvent.end.includes('T')
        ? new Date(calendarEvent.end)
        : new Date(calendarEvent.end + 'T00:00:00');
      
      if (notionEndDate.toDateString() !== calendarEndDate.toDateString()) {
        return true;
      }
    }
  }
  
  // 最終更新時刻の比較  
  const notionUpdated = new Date(notionItem.lastEditedTime);  
  const calendarUpdated = new Date(calendarEvent.updated);  
  
  return notionUpdated > calendarUpdated;  
}  

/**  
 * Googleカレンダーにイベントを作成
 */  
function createGoogleCalendarEvent(notionItem) {  
  try {  
    // 新しい日付処理を使用
    const calendarDates = createCalendarDateObject(notionItem.actionDay);
    
    const event = {  
      summary: notionItem.title,  
      start: calendarDates.start,  
      end: calendarDates.end,  
      description: createEventDescription(notionItem),  
      colorId: '0' // カレンダーの色
    };  
    
    const createdEvent = Calendar.Events.insert(event, CONFIG.CALENDAR_ID);  
    Logger.log(`カレンダーイベント作成: ${notionItem.title}`);  
    
    return createdEvent.id;  
    
  } catch (error) {  
    Logger.log(`カレンダーイベント作成エラー: ${error.message}`);  
    throw error;  
  }  
}  

/**  
 * Googleカレンダーのイベントを更新
 */  
function updateGoogleCalendarEvent(eventId, notionItem) {  
  try {  
    // 新しい日付処理を使用
    const calendarDates = createCalendarDateObject(notionItem.actionDay);
    
    const event = {  
      summary: notionItem.title,  
      start: calendarDates.start,  
      end: calendarDates.end,  
      description: createEventDescription(notionItem)  
    };  
    
    Calendar.Events.update(event, CONFIG.CALENDAR_ID, eventId);  
    Logger.log(`カレンダーイベント更新: ${notionItem.title}`);  
    
  } catch (error) {  
    Logger.log(`カレンダーイベント更新エラー: ${error.message}`);  
    throw error;  
  }  
}  

/**  
 * Googleカレンダーのイベントを削除
 */  
function deleteGoogleCalendarEvent(eventId) {  
  try {  
    Calendar.Events.remove(CONFIG.CALENDAR_ID, eventId);  
    Logger.log(`カレンダーイベント削除: ${eventId}`);  
    
  } catch (error) {  
    Logger.log(`カレンダーイベント削除エラー: ${error.message}`);  
    throw error;  
  }  
}  

/**  
 * イベントの説明文を作成
 */  
function createEventDescription(notionItem) {  
  let description = '[Notion-Sync]\n';  
  description += `Notion ID: ${notionItem.id}\n`;  
  description += `Status: ${notionItem.status || 'None'}\n`;  
  
  if (notionItem.url) {  
    description += `URL: ${notionItem.url}\n`;  
  }  
  
  description += `\nNotion Page: https://www.notion.so/${notionItem.id.replace(/-/g, '')}`;  
  
  return description;  
}  

/**  
 * NotionのEvent IDフィールドを更新
 */  
function updateNotionEventId(notionPageId, eventId) {  
  try {  
    const url = `https://api.notion.com/v1/pages/${notionPageId}`;  
    
    const payload = {  
      properties: {  
        'Event ID': {  
          rich_text: [  
            {  
              text: {  
                content: eventId  
              }  
            }  
          ]  
        }  
      }  
    };  
    
    const options = {  
      method: 'PATCH',  
      headers: {  
        'Authorization': `Bearer ${CONFIG.NOTION_API_KEY}`,  
        'Content-Type': 'application/json',  
        'Notion-Version': '2022-06-28'  
      },  
      payload: JSON.stringify(payload)  
    };  
    
    const response = UrlFetchApp.fetch(url, options);  
    
    if (response.getResponseCode() !== 200) {  
      const data = JSON.parse(response.getContentText());  
      throw new Error(`Notion更新エラー: ${data.message}`);  
    }  
    
    Logger.log(`NotionのEvent ID更新完了: ${notionPageId}`);  
    
  } catch (error) {  
    Logger.log(`NotionのEvent ID更新エラー: ${error.message}`);  
    throw error;  
  }  
}  

/**  
 * 定期実行トリガーを設定
 */  
function setupTriggers() {  
  // 既存のトリガーを削除  
  const triggers = ScriptApp.getProjectTriggers();  
  triggers.forEach(trigger => {  
    if (trigger.getHandlerFunction() === 'syncNotionWithGoogleCalendar') {  
      ScriptApp.deleteTrigger(trigger);  
    }  
  });  
  
  // 新しいトリガーを作成  
  ScriptApp.newTrigger('syncNotionWithGoogleCalendar')  
    .timeBased()  
    .everyMinutes(CONFIG.SYNC_INTERVAL_MINUTES)  
    .create();  
    
  Logger.log(`定期実行トリガーを設定しました（${CONFIG.SYNC_INTERVAL_MINUTES}分間隔）`);  
}  

/**  
 * 手動同期実行用関数（テスト用）
 */  
function manualSync() {  
  Logger.log('手動同期を開始します...');  
  const result = syncNotionWithGoogleCalendar();  
  Logger.log('手動同期が完了しました');  
  return result;  
}  

/**  
 * 初期設定関数
 */  
function initialize() {  
  Logger.log('初期設定を開始します...');  
  
  // スクリプトプロパティの確認  
  const apiKey = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');  
  if (!apiKey) {  
    Logger.log('警告: NOTION_API_KEYが設定されていません');  
    Logger.log('スクリプトプロパティでNOTION_API_KEYを設定してください');  
  }  
  
  const databaseId = PropertiesService.getScriptProperties().getProperty('NOTION_DATABASE_ID');  
  if (!databaseId) {  
    Logger.log('警告: NOTION_DATABASE_IDが設定されていません');  
    Logger.log('スクリプトプロパティでNOTION_DATABASE_IDを設定してください');  
  }  
  
  const dataSourceId = PropertiesService.getScriptProperties().getProperty('NOTION_DATA_SOURCE_ID');  
  if (!dataSourceId) {  
    Logger.log('警告: NOTION_DATA_SOURCE_IDが設定されていません');  
    Logger.log('スクリプトプロパティでNOTION_DATA_SOURCE_IDを設定してください');  
  }  
  
  const scheduleTagId = PropertiesService.getScriptProperties().getProperty('SCHEDULE_TAG_ID');  
  if (!scheduleTagId) {  
    Logger.log('警告: SCHEDULE_TAG_IDが設定されていません');  
    Logger.log('スクリプトプロパティでSCHEDULE_TAG_IDを設定してください');  
  }  
  
  const calendarId = PropertiesService.getScriptProperties().getProperty('CALENDAR_ID');  
  if (calendarId) {  
    Logger.log(`カレンダーID: ${calendarId} を使用します`);  
  } else {  
    Logger.log('カレンダーID: primary (デフォルト) を使用します');  
  }  
  
  // Google Calendar APIの有効化確認  
  try {  
    Calendar.CalendarList.list();  
    Logger.log('Google Calendar API: 有効');  
  } catch (error) {  
    Logger.log('エラー: Google Calendar APIが有効化されていません');  
    Logger.log('Google Cloud Consoleでカレンダー APIを有効化してください');  
  }  
  
  // トリガー設定  
  setupTriggers();  
  
  Logger.log('初期設定が完了しました');  
}  
