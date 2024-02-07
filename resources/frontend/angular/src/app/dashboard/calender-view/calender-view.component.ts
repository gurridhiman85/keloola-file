import { Component, OnInit } from '@angular/core';
import { CalenderReminderDto } from '@core/domain-classes/calender-reminder';
import { CalendarEvent, CalendarView } from 'angular-calendar';
import { isSameDay, isSameMonth, parseISO } from 'date-fns';
import { forkJoin } from 'rxjs';
import { DashboradService } from '../dashboard.service';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { DocumentReminderComponent } from '../../document/document-reminder/document-reminder.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-calender-view',
  templateUrl: './calender-view.component.html',
  styleUrls: ['./calender-view.component.css'],
})
export class CalenderViewComponent implements OnInit {
  documents: DocumentInfo[] = [];
  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();
  activeDayIsOpen: boolean = false;
  CalendarView = CalendarView;
  events: CalendarEvent[] = [];
  isProcessing = false;
  constructor(
    private dashboardService: DashboradService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    var currentDate = new Date();
    this.gerReminders(currentDate.getMonth() + 1, currentDate.getFullYear());
  }

  viewDateChange(event: Date) {
    this.activeDayIsOpen = false;
    this.gerReminders(event.getMonth() + 1, event.getFullYear());
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
      this.viewDate = date;
    }
  }

  handleEvent(action: string, event: CalendarEvent): void {
      this.addReminder(event);
  }

  addReminder(event) {
    var documentInfo: DocumentInfo = { reminderDetails: event };
    // var documentInfo: DocumentInfo;
    // documentInfo.reminderDetails = event;
    this.dialog.open(DocumentReminderComponent, {
      data: documentInfo,
      width: '80vw',
      height: '80vh',
    });
  }

  gerReminders(month: number, year: number) {
    this.events = [];
    const dailyReminders = this.dashboardService.getDailyReminders(month, year);
    const weeklyReminders = this.dashboardService.getWeeklyReminders(
      month,
      year
    );
    const monthlyReminders = this.dashboardService.getMonthlyReminders(
      month,
      year
    );
    const quarterlyReminders = this.dashboardService.getQuarterlyReminders(
      month,
      year
    );
    const halfYearlyReminders = this.dashboardService.getHalfYearlyReminders(
      month,
      year
    );
    const yearlyReminders = this.dashboardService.getYearlyReminders(
      month,
      year
    );
    const oneTimeReminders = this.dashboardService.getOneTimeReminders(
      month,
      year
    );
    this.isProcessing = true;
    forkJoin([
      dailyReminders,
      weeklyReminders,
      monthlyReminders,
      quarterlyReminders,
      halfYearlyReminders,
      yearlyReminders,
      oneTimeReminders,
    ]).subscribe(
      (results) => {
        this.isProcessing = false;
        this.addEvent(results[0] as CalenderReminderDto[]);
        this.addEvent(results[1] as CalenderReminderDto[]);
        this.addEvent(results[2] as CalenderReminderDto[]);
        this.addEvent(results[3] as CalenderReminderDto[]);
        this.addEvent(results[4] as CalenderReminderDto[]);
        this.addEvent(results[5] as CalenderReminderDto[]);
        this.addEvent(results[6] as CalenderReminderDto[]);
      },
      () => (this.isProcessing = false)
    );
  }

  addEvent(calenterReminder: CalenderReminderDto[]) {
    const event = calenterReminder.map((c) => {
      c.start = parseISO(c.start.toString());
      c.end = parseISO(c.end.toString());
      return c;
    });
    this.events = this.events.concat(event);
  }
}
