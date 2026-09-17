import { useState } from 'react';

export type CalendarSubTab = 'Month' | 'Week' | 'Agenda' | 'Milestones' | 'Sync';
export type FilterType = 'All' | 'Milestone' | 'Meeting' | 'Deadline' | 'Task';

export interface CalendarEventItem {
  day: number;
  title: string;
  type: 'milestone' | 'meeting' | 'deadline' | 'task';
  time?: string;
}

export interface CalendarWeekEventItem {
  dayIndex: number; // 0 for Sun, 1 for Mon, etc.
  dayNum: number;
  title: string;
  time: string;
  type: 'milestone' | 'meeting' | 'deadline' | 'task';
}

export interface AgendaItemData {
  time: string;
  title: string;
  subtitle: string;
  type: 'Meeting' | 'Milestone' | 'Task' | 'Deadline';
  borderColor: string;
}

export interface AgendaDayGroupData {
  dateLabel: string;
  items: AgendaItemData[];
}

export interface MilestoneItemData {
  title: string;
  dueDate: string;
  status: 'On track' | 'At risk' | 'Complete' | 'Not started';
  progress: number;
  tasksInfo: string;
  cardBorderClass?: string;
  progressBarClass: string;
  badgeClass: string;
  iconType: 'progress' | 'risk' | 'complete' | 'default';
}

export const CALENDAR_EVENTS_DATA: CalendarEventItem[] = [
  { day: 2, title: 'Validation milestone review', type: 'milestone' },
  { day: 6, title: 'Partner call, Sahel Fund', type: 'meeting' },
  { day: 9, title: 'VAT filing due', type: 'deadline' },
  { day: 13, title: 'Interview 3 gig workers', type: 'task' },
  { day: 13, title: 'Pricing test kickoff', type: 'milestone' },
  { day: 16, title: 'Demo call, Lagos Riders', type: 'meeting' },
  { day: 20, title: 'CAC annual return', type: 'deadline' },
  { day: 24, title: 'Investor update send', type: 'task' },
  { day: 27, title: 'Weekly review', type: 'meeting' },
  { day: 27, title: 'Close validation milestone', type: 'milestone' },
  { day: 29, title: 'Grant deadline, GIZ', type: 'deadline' },
];

export const DAYS_OF_WEEK_LIST = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const CALENDAR_DAYS_GRID_MATRIX = [
  [null, null, null, 1, 2, 3, 4],
  [5, 6, 7, 8, 9, 10, 11],
  [12, 13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23, 24, 25],
  [26, 27, 28, 29, 30, 31, null]
];

export const WEEK_DAYS_LIST = [
  { name: 'SUN', num: 12 },
  { name: 'MON', num: 13 },
  { name: 'TUE', num: 14 },
  { name: 'WED', num: 15 },
  { name: 'THU', num: 16 },
  { name: 'FRI', num: 17 },
  { name: 'SAT', num: 18 },
];

export const WEEK_EVENTS_DATA: CalendarWeekEventItem[] = [
  { dayIndex: 1, dayNum: 13, title: 'Interview 3 gig workers', time: '09:00 AM', type: 'task' },
  { dayIndex: 1, dayNum: 13, title: 'Pricing test kickoff', time: '02:00 PM', type: 'milestone' },
  { dayIndex: 4, dayNum: 16, title: 'Demo call, Lagos Riders', time: '11:00 AM', type: 'meeting' },
  { dayIndex: 5, dayNum: 17, title: 'Review runway assumptions', time: '03:00 PM', type: 'task' },
];

export const HOURS_LIST = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', 
  '04:00 PM', '05:00 PM'
];

export const AGENDA_GROUPS_DATA: AgendaDayGroupData[] = [
  {
    dateLabel: 'TODAY, MON JUL 27',
    items: [
      { time: '09:00', title: 'Weekly review', subtitle: 'With Daniel', type: 'Meeting', borderColor: 'border-l-[#183B28]' },
      { time: '17:00', title: 'Close validation milestone', subtitle: 'Roadmap milestone', type: 'Milestone', borderColor: 'border-l-[#B39353]' },
    ]
  },
  {
    dateLabel: 'TOMORROW, TUE',
    items: [
      { time: '14:00', title: 'Send pricing survey to 20 users', subtitle: 'From your mission', type: 'Task', borderColor: 'border-l-[#1E3E2B]' },
    ]
  },
  {
    dateLabel: 'WED JUL 29',
    items: [
      { time: 'All day', title: 'Grant deadline, GIZ Digital Inclusion Fund', subtitle: 'Application due', type: 'Deadline', borderColor: 'border-l-[#B93838]' },
    ]
  },
  {
    dateLabel: 'THU JUL 30',
    items: [
      { time: '11:00', title: 'Demo call, MarketPlus', subtitle: 'Sales pipeline', type: 'Meeting', borderColor: 'border-l-[#183B28]' },
      { time: '15:00', title: 'Review runway assumptions', subtitle: 'With Grace', type: 'Task', borderColor: 'border-l-[#1E3E2B]' },
    ]
  },
];

export const MILESTONES_DATA_LIST: MilestoneItemData[] = [
  {
    title: 'Validate demand with 20 interviews',
    dueDate: 'Due Friday, Jul 31',
    status: 'On track',
    progress: 85,
    tasksInfo: '11 of 13 tasks complete',
    progressBarClass: 'bg-[#B39353]',
    badgeClass: 'bg-[#F2ECE1] text-[#7A6025]',
    iconType: 'progress',
  },
  {
    title: 'Pricing test concluded',
    dueDate: 'Due Aug 8',
    status: 'At risk',
    progress: 35,
    tasksInfo: '3 of 9 tasks complete · blocked on survey send',
    cardBorderClass: 'border-[#B93838]/60 bg-white',
    progressBarClass: 'bg-[#B93838]',
    badgeClass: 'bg-[#FDF2F2] text-[#B93838]',
    iconType: 'risk',
  },
  {
    title: 'Company incorporated',
    dueDate: 'Completed Jun 20',
    status: 'Complete',
    progress: 100,
    tasksInfo: '6 of 6 tasks complete',
    progressBarClass: 'bg-[#183B28]',
    badgeClass: 'bg-[#E5EFEA] text-[#183B28]',
    iconType: 'complete',
  },
  {
    title: 'First 100 paying savers',
    dueDate: 'Due Sep 30',
    status: 'Not started',
    progress: 0,
    tasksInfo: '0 of 8 tasks complete',
    progressBarClass: 'bg-[#D5DDD6]',
    badgeClass: 'bg-[#F5F5F0] text-[#617065]',
    iconType: 'default',
  },
  {
    title: 'Pre-seed round closed',
    dueDate: 'Due Dec 15',
    status: 'Not started',
    progress: 0,
    tasksInfo: '0 of 12 tasks complete',
    progressBarClass: 'bg-[#D5DDD6]',
    badgeClass: 'bg-[#F5F5F0] text-[#617065]',
    iconType: 'default',
  },
];

export function useCalendarApi() {
  return {
    eventsData: CALENDAR_EVENTS_DATA,
    daysOfWeek: DAYS_OF_WEEK_LIST,
    gridMatrix: CALENDAR_DAYS_GRID_MATRIX,
    weekDaysList: WEEK_DAYS_LIST,
    weekEventsData: WEEK_EVENTS_DATA,
    hoursList: HOURS_LIST,
    agendaGroups: AGENDA_GROUPS_DATA,
    milestones: MILESTONES_DATA_LIST,
  };
}
