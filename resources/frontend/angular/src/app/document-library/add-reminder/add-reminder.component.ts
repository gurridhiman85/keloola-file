import { Component, Inject, Input, OnInit } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ReminderFrequency } from '@core/domain-classes/reminder-frequency';
import { User } from '@core/domain-classes/user';
import { CommonService } from '@core/services/common.service';
import { BaseComponent } from 'src/app/base.component';
import { Reminder } from '@core/domain-classes/reminder';
import { Frequency } from '@core/domain-classes/frequency.enum';
import { DayOfWeek } from '@core/domain-classes/dayOfWeek.enum';
import { Quarter } from '@core/domain-classes/quarter.enum';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-reminder',
  templateUrl: './add-reminder.component.html',
  styleUrls: ['./add-reminder.component.scss'],
})
export class AddReminderComponent extends BaseComponent implements OnInit {
  reminderFrequencies: ReminderFrequency[] = [];
  reminderForm: UntypedFormGroup;
  minDate = new Date();
  users: User[] = [];
  selectedUsers: User[] = [];
  reminder: Reminder;
  isLoading = false;

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
    private commonService: CommonService,
    @Inject(MAT_DIALOG_DATA) public data: string,
    private dialogRef: MatDialogRef<AddReminderComponent>
  ) {
    super();
  }

  ngOnInit(): void {
    for (let i = 1; i <= 31; i++) {
      this.days.push(i);
    }
    this.getReminderFrequency();
    this.createReminderForm();
    this.getReminder();
    //this.getUsers();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  getReminder() {
    this.sub$.sink = this.commonService
      .getMyReminder(this.data)
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
      subject: [{ value: '', disabled: true }, [Validators.required]],
      message: [{ value: '', disabled: true }, [Validators.required]],
      frequency: [{ value: '', disabled: true }],
      isRepeated: [{ value: false, disabled: true }],
      isEmailNotification: [{ value: false, disabled: true }],
      startDate: [
        { value: currentDate, disabled: true },
        [Validators.required],
      ],
      endDate: [{ value: null, disabled: true }],
      dayOfWeek: [{ value: null, disabled: true }],
      documentId: [{ value: null, disabled: true }],
    });
  }

  checkData(event: MatCheckboxChange) {
    if (event.checked) {
      this.reminderForm.get('frequency').setValidators([Validators.required]);
    } else {
      this.reminderForm.get('frequency').setValidators([]);
    }
    this.reminderForm.updateValueAndValidity();
  }

  getUsers() {
    this.sub$.sink = this.commonService.getUsers().subscribe((u: User[]) => {
      this.users = u;
      if (this.reminder) {
        const reminderUsers = this.reminder.reminderUsers.map((c) => c.userId);
        this.selectedUsers = this.users.filter(
          (c) => reminderUsers.indexOf(c.id) >= 0
        );
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
      dayOfWeek: [dayOfWeek],
      isActive: [{ value: true, disabled: true }],
      name: [DayOfWeek[dayOfWeek]],
    });
  }

  createQuarterlyReminderFormGroup(
    quater: Quarter,
    name: string,
    monthValues: any[]
  ) {
    return this.fb.group({
      id: [''],
      reminderId: [''],
      quarter: [quater],
      day: [{ value: this.getCurrentDay(), disabled: true }],
      month: [{ value: monthValues[0], disabled: true }],
      name: [name],
      monthValues: [monthValues],
    });
  }

  createHalfYearlyReminderFormGroup(
    quater: Quarter,
    name: string,
    monthValues: any[]
  ) {
    return this.fb.group({
      id: [''],
      reminderId: [''],
      quarter: [quater],
      day: [{ value: this.getCurrentDay(), disabled: true }],
      month: [{ value: monthValues[0], disabled: true }],
      name: [name],
      monthValues: [monthValues],
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
}
