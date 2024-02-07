import { Component, Inject, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Category } from '@core/domain-classes/category';
import { CategoryService } from '@core/services/category.service';
import { BaseComponent } from 'src/app/base.component';

@Component({
  selector: 'app-manage-category',
  templateUrl: './manage-category.component.html',
  styleUrls: ['./manage-category.component.scss'],
})
export class ManageCategoryComponent
  extends BaseComponent
  implements OnChanges {
  isEdit = false;
  constructor(
    public dialogRef: MatDialogRef<ManageCategoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Category,
    private categoryService: CategoryService
  ) {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      if (this.data.id) {
        this.isEdit = true;
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  saveCategory(): void {
    if (this.data.id) {
      this.categoryService.update(this.data).subscribe((c) => {
        this.dialogRef.close(c);
      });
    } else {
      this.categoryService.add(this.data).subscribe((c) => {
        this.dialogRef.close(c);
      });
    }
  }
}
