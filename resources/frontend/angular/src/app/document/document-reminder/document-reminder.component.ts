import { Component, Inject, OnInit } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DayOfWeek } from '@core/domain-classes/dayOfWeek.enum';
import { DocumentInfo } from '@core/domain-classes/document-info';
import { Frequency } from '@core/domain-classes/frequency.enum';
import { Quarter } from '@core/domain-classes/quarter.enum';
import { Reminder } from '@core/domain-classes/reminder';
import { ReminderFrequency } from '@core/domain-classes/reminder-frequency';
import { User } from '@core/domain-classes/user';
import { CommonService } from '@core/services/common.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';
import { ReminderService } from 'src/app/reminder/reminder.service';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-document-reminder',
  templateUrl: './document-reminder.component.html',
  styleUrls: ['./document-reminder.component.scss'],
})
export class DocumentReminderComponent extends BaseComponent implements OnInit {
  reminderFrequencies: ReminderFrequency[] = [];
  reminderForm: UntypedFormGroup;
  minDate = new Date();
  users: User[] = [];
  selectedUsers: User[] = [];
  reminder: Reminder;
  isLoading = false;
  detailShow: boolean = false;
  reminderDetails:any;
  public showSpinners = true;
  public showSeconds = false;
  public touchUi = false;
  public stepHour = 1;
  public stepMinute = 1;
  public stepSecond = 1;
  selectedUserNames: string = '';

  dayOfWeek = [
    {
      id: 0,
      name: 'Sunday',
    },
    {
      id: 1,
      name: 'Monday',
    },
    {
      id: 2,
      name: 'Tuesday',
    },
    {
      id: 3,
      name: 'Wednesday',
    },
    {
      id: 4,
      name: 'Thursday',
    },
    {
      id: 5,
      name: 'Friday',
    },
    {
      id: 6,
      name: 'Saturday',
    },
  ];

  months = [
    {
      id: 1,
      name: 'January',
    },
    {
      id: 2,
      name: 'February',
    },
    {
      id: 3,
      name: 'March',
    },
    {
      id: 4,
      name: 'April',
    },
    {
      id: 5,
      name: 'May',
    },
    {
      id: 6,
      name: 'June',
    },
    {
      id: 7,
      name: 'July',
    },
    {
      id: 8,
      name: 'August',
    },
    {
      id: 9,
      name: 'September',
    },
    {
      id: 10,
      name: 'October',
    },
    {
      id: 11,
      name: 'November',
    },
    {
      id: 12,
      name: 'December',
    },
  ];
  days: number[] = [];

  get dailyRemindersArray(): UntypedFormArray {
    return <UntypedFormArray>this.reminderForm.get('dailyReminders');
  }

  get quarterlyRemindersArray(): UntypedFormArray {
    return <UntypedFormArray>this.reminderForm.get('quarterlyReminders');
  }

  get halfYearlyRemindersArray(): UntypedFormArray {
    return <UntypedFormArray>this.reminderForm.get('halfYearlyReminders');
  }

  constructor(
    private fb: UntypedFormBuilder,
    private reminderService: ReminderService,
    private commonService: CommonService,
    private toastrService: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: DocumentInfo,
    private dialogRef: MatDialogRef<DocumentReminderComponent>,
    private translationService: TranslationService,
    private activatedRoute: ActivatedRoute,
  ) {
    super();
  }

  ngOnInit(): void {
    for (let i = 1; i <= 31; i++) {
      this.days.push(i);
    }
    this.getReminderFrequency();
    if(this.data.reminderDetails){
      this.detailShow = true;
      this.reminderDetails = this.data.reminderDetails
      this.createReminderForm();
      this.getReminder(this.reminderDetails.id)
    }else{
      this.createReminderForm();
    }
    this.getUsers();
  }


  closeDialog() {
    this.dialogRef.close();
  }

  getReminder(id) {
    this.sub$.sink = this.commonService
      .getMyReminder(id)
      .subscribe((c: Reminder) => {
        this.reminder = { ...c };
        if (this.reminder.dailyReminders) {
          this.reminder.dailyReminders = this.reminder.dailyReminders.sort(
            (c1, c2) => c1.dayOfWeek - c2.dayOfWeek
          );
        }

        if (this.reminder.quarterlyReminders) {
          this.reminder.quarterlyReminders =
            this.reminder.quarterlyReminders.sort(
              (c1, c2) => c1.quarter - c2.quarter
            );
        }

        if (this.reminder.halfYearlyReminders) {
          this.reminder.halfYearlyReminders =
            this.reminder.halfYearlyReminders.sort(
              (c1, c2) => c1.quarter - c2.quarter
            );
        }
        this.reminderForm.patchValue(this.reminder);
        this.onFrequencyChange();
        this.reminderForm.patchValue(this.reminder);
        if (this.reminderForm.get('isRepeated').value) {
          this.reminderForm
            .get('frequency')
            .setValidators([Validators.required]);
          this.reminderForm.updateValueAndValidity();
        }
      });
  }

  getReminderFrequency() {
    this.sub$.sink = this.commonService
      .getReminderFrequency()
      .subscribe((f) => (this.reminderFrequencies = [...f]));
  }
  createReminderForm() {
    var currentDate = new Date();
    this.reminderForm = this.fb.group({
      id: [''],
      subject: [{ value: '', disabled: this.detailShow }, [Validators.required]],
      message: [{ value: '', disabled: this.detailShow }, [Validators.required]],
      frequency: [{ value:'', disabled: this.detailShow }],
      isRepeated: [{ value: false, disabled: this.detailShow }],
      isEmailNotification: [{ value: false, disabled: this.detailShow }],
      startDate: [{ value: currentDate, disabled: this.detailShow }, [Validators.required]],
      endDate: [{ value : null, disabled: this.detailShow }],
      dayOfWeek: [{ value: 2, disabled: this.detailShow }],
      documentId: [this.data.id],
    });
  }

  checkData(event: MatCheckboxChange) {
    if (event.checked) {
      this.reminderForm.get('frequency').setValidators([Validators.required]);
    } else {
      this.reminderForm.get('frequency').setValidators([]);
    }
    this.reminderForm.markAllAsTouched();
  }

  createReminder() {
    if (!this.reminderForm.valid) {
      this.reminderForm.markAllAsTouched();
      return;
    }
    let reminder: Reminder = this.reminderForm.value;
    reminder.reminderUsers = this.selectedUsers.map((u) => {
      return {
        reminderId: reminder.id,
        userId: u.id,
      };
    });

    if (!reminder.isRepeated) {
      reminder.dailyReminders = [];
      reminder.quarterlyReminders = [];
      reminder.halfYearlyReminders = [];
    }

    if (!this.reminder) {
      this.isLoading = true;
      this.sub$.sink = this.reminderService.addDocumentReminder(reminder).subscribe(
        (d) => {
          this.toastrService.success(
            this.translationService.getValue('REMINDER_CREATED_SUCCESSFULLY')
          );
          // this.route.navigate(['/reminders']);
          this.dialogRef.close();
          this.isLoading = false;
        },
        () => (this.isLoading = false)
      );
    } else {
      if (reminder.dailyReminders) {
        reminder.dailyReminders = reminder.dailyReminders.map((c) => {
          c.reminderId = this.reminder.id;
          return c;
        });
      }
      if (reminder.quarterlyReminders) {
        reminder.quarterlyReminders = reminder.quarterlyReminders.map((c) => {
          c.reminderId = this.reminder.id;
          return c;
        });
      }
      if (reminder.halfYearlyReminders) {
        reminder.halfYearlyReminders = reminder.halfYearlyReminders.map((c) => {
          c.reminderId = this.reminder.id;
          return c;
        });
      }
      this.isLoading = true;
      this.sub$.sink = this.reminderService.updateReminder(reminder).subscribe(
        (d) => {
          this.toastrService.success(
            this.translationService.getValue('REMINDER_UPDATED_SUCCESSFULLY')
          );
          // this.route.navigate(['/reminders']);
          this.dialogRef.close();
          this.isLoading = false;
        },
        () => (this.isLoading = false)
      );
    }
  }

  getUsers() {
    this.sub$.sink = this.commonService.getUsers().subscribe((u: User[]) => {
      this.users = u;
      if (this.reminder) {
        const reminderUsers = this.reminder.reminderUsers.map((c) => c.userId);
        this.selectedUsers = this.users.filter(
          (c) => reminderUsers.indexOf(c.id) >= 0
        );
        this.selectedUserNames = this.selectedUsers.map(user => user.firstName + ' ' + user.lastName).join(', ');
      }
    });
  }

  onFrequencyChange() {
    let frequency = this.reminderForm.get('frequency').value;
    frequency = frequency == 0 ? '0' : frequency;
    if (frequency == Frequency.Daily.toString()) {
      this.removeQuarterlyReminders();
      this.removeHalfYearlyReminders();
      this.addDailReminders();
      this.reminderForm.get('dayOfWeek').setValue('');
    } else if (frequency == Frequency.Weekly.toString()) {
      this.removeDailReminders();
      this.removeQuarterlyReminders();
      this.removeHalfYearlyReminders();
      this.reminderForm.get('dayOfWeek').setValue(2);
    } else if (frequency == Frequency.Quarterly.toString()) {
      this.removeDailReminders();
      this.removeHalfYearlyReminders();
      this.addQuarterlyReminders();
      this.reminderForm.get('dayOfWeek').setValue('');
    } else if (frequency == Frequency.HalfYearly.toString()) {
      this.removeDailReminders();
      this.removeQuarterlyReminders();
      this.addHalfYearlyReminders();
      this.reminderForm.get('dayOfWeek').setValue('');
    } else {
      this.removeDailReminders();
      this.removeQuarterlyReminders();
      this.removeHalfYearlyReminders();
      this.reminderForm.get('dayOfWeek').setValue('');
    }
  }

  addDailReminders() {
    if (!this.reminderForm.contains('dailyReminders')) {
      var formArray = this.fb.array([]);
      formArray.push(this.createDailyReminderFormGroup(DayOfWeek.Sunday));
      formArray.push(this.createDailyReminderFormGroup(DayOfWeek.Monday));
      formArray.push(this.createDailyReminderFormGroup(DayOfWeek.Tuesday));
      formArray.push(this.createDailyReminderFormGroup(DayOfWeek.Wednesday));
      formArray.push(this.createDailyReminderFormGroup(DayOfWeek.Thursday));
      formArray.push(this.createDailyReminderFormGroup(DayOfWeek.Friday));
      formArray.push(this.createDailyReminderFormGroup(DayOfWeek.Saturday));
      this.reminderForm.addControl('dailyReminders', formArray);
      this.reminderForm.get('isActive')?.disable();
    }
  }

  addQuarterlyReminders() {
    if (!this.reminderForm.contains('quarterlyReminders')) {
      var formArray = this.fb.array([]);
      var firstQuaterMonths = this.months.filter(
        (c) => [1, 2, 3].indexOf(c.id) >= 0
      );
      var secondQuaterMonths = this.months.filter(
        (c) => [4, 5, 6].indexOf(c.id) >= 0
      );
      var thirdQuaterMonths = this.months.filter(
        (c) => [7, 8, 9].indexOf(c.id) >= 0
      );
      var forthQuaterMonths = this.months.filter(
        (c) => [10, 11, 12].indexOf(c.id) >= 0
      );
      formArray.push(
        this.createQuarterlyReminderFormGroup(
          Quarter.Quarter1,
          'Jan - Mar',
          firstQuaterMonths
        )
      );
      formArray.push(
        this.createQuarterlyReminderFormGroup(
          Quarter.Quarter2,
          'Apr - Jun',
          secondQuaterMonths
        )
      );
      formArray.push(
        this.createQuarterlyReminderFormGroup(
          Quarter.Quarter3,
          'Jul - Sept',
          thirdQuaterMonths
        )
      );
      formArray.push(
        this.createQuarterlyReminderFormGroup(
          Quarter.Quarter4,
          'Oct - Dec',
          forthQuaterMonths
        )
      );
      this.reminderForm.addControl('quarterlyReminders', formArray);
    }
  }

  addHalfYearlyReminders() {
    if (!this.reminderForm.contains('halfYearlyReminders')) {
      var formArray = this.fb.array([]);
      var firstQuaterMonths = this.months.filter(
        (c) => [1, 2, 3, 4, 5, 6].indexOf(c.id) >= 0
      );
      var secondQuaterMonths = this.months.filter(
        (c) => [7, 8, 9, 10, 11, 13].indexOf(c.id) >= 0
      );
      formArray.push(
        this.createHalfYearlyReminderFormGroup(
          Quarter.Quarter1,
          'Jan - Jun',
          firstQuaterMonths
        )
      );
      formArray.push(
        this.createHalfYearlyReminderFormGroup(
          Quarter.Quarter2,
          'Jul - Dec',
          secondQuaterMonths
        )
      );
      this.reminderForm.addControl('halfYearlyReminders', formArray);
    }
  }

  removeDailReminders() {
    if (this.reminderForm.contains('dailyReminders')) {
      this.reminderForm.removeControl('dailyReminders');
    }
  }

  removeQuarterlyReminders() {
    if (this.reminderForm.contains('quarterlyReminders')) {
      this.reminderForm.removeControl('quarterlyReminders');
    }
  }

  removeHalfYearlyReminders() {
    if (this.reminderForm.contains('halfYearlyReminders')) {
      this.reminderForm.removeControl('halfYearlyReminders');
    }
  }

  createDailyReminderFormGroup(dayOfWeek: DayOfWeek) {
    return this.fb.group({
      id: [''],
      reminderId: [''],
      dayOfWeek: { value: dayOfWeek, disabled: this.detailShow },
      isActive: { value: true, disabled: this.detailShow },
      name: { value: DayOfWeek[dayOfWeek], disabled: this.detailShow },
    });
  }

  createQuarterlyReminderFormGroup(
    quater: Quarter,
    name: string,
    monthValues: any[]
  ) {
    return this.fb.group({
      id: [''],
      reminderId: { value: '', disabled: this.detailShow },
      quarter: { value: quater, disabled: this.detailShow },
      day: { value: this.getCurrentDay(), disabled: this.detailShow },
      month: { value: monthValues[0], disabled: this.detailShow },
      name: { value: name, disabled: this.detailShow },
      monthValues: { value: monthValues, disabled: this.detailShow },
    });
  }

  createHalfYearlyReminderFormGroup(
    quater: Quarter,
    name: string,
    monthValues: any[]
  ) {
    return this.fb.group({
      id: [''],
      reminderId: { value: '', disabled: this.detailShow },
      quarter: { value: quater, disabled: this.detailShow },
      day: { value: this.getCurrentDay(), disabled: this.detailShow },
      month: { value: monthValues[0], disabled: this.detailShow },
      name: { value: name, disabled: this.detailShow },
      monthValues: { value: monthValues, disabled: this.detailShow },
    });
  }

  getCurrentDay(): number {
    return new Date().getDate();
  }

  onDateChange(formGrouup: any) {
    const day = formGrouup.get('day').value;
    const month = formGrouup.get('month').value;
    var daysInMonth = new Date(
      new Date().getFullYear(),
      Number.parseInt(month),
      0
    ).getDate();
    if (day > daysInMonth) {
      formGrouup.setErrors({
        invalidDate: 'Invalid Date',
      });
      formGrouup.markAllAsTouched();
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
