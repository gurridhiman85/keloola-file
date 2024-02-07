import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TruncatePipe } from './truncate.pipe';
import { ReminderFrequencyPipe } from './reminder-frequency.pipe';

@NgModule({
  declarations: [TruncatePipe, ReminderFrequencyPipe],
  imports: [CommonModule],
  exports: [TruncatePipe, ReminderFrequencyPipe],
})
export class PipesModule {}
