import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenameDocumentComponent } from './rename-document.component';

describe('RenameDocumentComponent', () => {
  let component: RenameDocumentComponent;
  let fixture: ComponentFixture<RenameDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RenameDocumentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RenameDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
