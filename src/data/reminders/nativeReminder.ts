import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { reconcileReminder, reminderId, type ReminderPort } from '../../domain/reminders/reconcileReminder';
import { usePreferences } from '../../store/preferences';
const channelId='healthmate-daily';
Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:false,shouldSetBadge:false})});
const port:ReminderPort={
 permission:async(request)=>{await Notifications.setNotificationChannelAsync(channelId,{name:'Daily activity reminder',importance:AndroidImportance.DEFAULT,enableVibrate:false});let permission=await Notifications.getPermissionsAsync();if(!permission.granted&&request&&permission.canAskAgain)permission=await Notifications.requestPermissionsAsync();return permission.granted;},
 list:async()=> (await Notifications.getAllScheduledNotificationsAsync()).map(n=>({id:n.identifier,hour:Number(n.content.data?.hour),minute:Number(n.content.data?.minute),zone:String(n.content.data?.zone??'')})),
 cancel:id=>Notifications.cancelScheduledNotificationAsync(id),
 schedule:async(hour,minute,zone)=>{await Notifications.scheduleNotificationAsync({identifier:reminderId,content:{title:'HealthMate',body:'A little care, every day. Remember to update your daily health record.',data:{hour,minute,zone},sound:false},trigger:{type:Notifications.SchedulableTriggerInputTypes.DAILY,hour,minute,channelId,delivery:'bestEffort'}});}
};
let tail:Promise<unknown>=Promise.resolve();
export function syncReminder(request=false):Promise<string>{const run=async()=>{const state=usePreferences.getState();if(!state.loaded)return 'Loading reminder preferences…';const zone=Intl.DateTimeFormat().resolvedOptions().timeZone+':'+new Date().getTimezoneOffset();return reconcileReminder(state.preferences,port,zone,request);};const next=tail.then(run,run);tail=next.catch(()=>undefined);return next;}
