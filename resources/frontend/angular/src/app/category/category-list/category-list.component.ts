import { Component, OnInit } from '@angular/core';
import { Category } from '@core/domain-classes/category';
import { CategoryService } from '@core/services/category.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { BaseComponent } from 'src/app/base.component';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent extends BaseComponent implements OnInit {
  categories$: Observable<Category[]>;
  constructor(
    private categoryService: CategoryService,
    private toastrService: ToastrService,
    private translationService: TranslationService) {
    super();
  }
  ngOnInit(): void {
    this.getCategories();
  }

  getCategories(): void {
    this.categories$ = this.categoryService.getAllCategories();
  }

  deleteCategory(id: string): void {
    this.categoryService.delete(id).subscribe(d => {
      this.toastrService.success(this.translationService.getValue(`CATEGORY_DELETED_SUCCESSFULLY`));
      this.getCategories();
    });

  }

  manageCategory(): void {
    this.getCategories();
  }
}
