import { DOCUMENT } from '@angular/common';
import {
  Component,
  Inject,
  ElementRef,
  OnInit,
  Renderer2,
  HostListener,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '@core/services/language.service';
import { WINDOW } from '@core/services/window.service';
import { SecurityService } from '@core/security/security.service';
import { LanguageFlag } from '@core/domain-classes/language-flag';
import { TranslationService } from '@core/services/translation.service';
import { UserAuth } from '@core/domain-classes/user-auth';
import { NotificationService } from 'src/app/notification/notification.service';
import { UserNotification } from '@core/domain-classes/notification';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent
  implements OnInit {
  isNavbarCollapsed = true;
  isNavbarShow = true;
  countryName: string | string[] = [];
  defaultFlag?: string;
  isOpenSidebar?: boolean;
  docElement: HTMLElement | undefined;
  isFullScreen = false;
  appUserAuth: UserAuth = null;
  language: LanguageFlag;
  newNotificationCount = 0;
  notifications: UserNotification[] = [];
  refereshReminderTimeInMinute = 10;
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(WINDOW) private window: Window,
    private renderer: Renderer2,
    public elementRef: ElementRef,
    private router: Router,
    public languageService: LanguageService,
    private securityService: SecurityService,
    private translationService: TranslationService,
    private cd: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {
  }
  languages: LanguageFlag[] = [
    {
      lang: 'en',
      name: 'English',
      flag: 'assets/images/flags/united-states.svg',
    },
    {
      lang: 'es',
      name: 'Spanish ',
      flag: 'assets/images/flags/brazil.svg',
    },
    {
      lang: 'fr',
      name: 'French ',
      flag: 'assets/images/flags/france.svg',
    },
    {
      lang: 'ar',
      name: 'Arabic ',
      flag: 'assets/images/flags/saudi-arabia.svg',
    },
    {
      lang: 'ru',
      name: 'Russian',
      flag: 'assets/images/flags/russia.svg',
    },
    {
      lang: 'ja',
      name: 'Japanese',
      flag: 'assets/images/flags/japan.svg',
    },
    {
      lang: 'ko',
      name: 'Korean',
      flag: 'assets/images/flags/south-korea.svg',
    },
    {
      lang: 'cn',
      name: 'Chinese',
      flag: 'assets/images/flags/china.svg',
    },
  ];
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.window.pageYOffset ||
      this.document.documentElement.scrollTop ||
      this.document.body.scrollTop ||
      0;
    // if (offset > 50) {
    //   this.isNavbarShow = true;
    // } else {
    //   this.isNavbarShow = false;
    // }
  }
  ngOnInit() {
    this.setTopLogAndName();
    this.getNotification();
    this.setDefaultLanguage();

  }

  setDefaultLanguage() {
    const lang = this.translationService.getSelectedLanguage();
    if (lang) {
      this.setLanguageWithRefresh(lang);
      this.defaultFlag = this.languages.find(c => c.lang == lang)?.flag;
    }
  }

  setLanguageWithRefresh(lang: string) {
    this.languages.forEach((language: LanguageFlag) => {
      if (language.lang === lang) {
        language.active = true;
        this.language = language;
      } else {
        language.active = false;
      }
    });
    this.translationService.setLanguage(lang);
    this.defaultFlag = this.languages.find(c => c.lang == lang)?.flag;
  }

  setNewLanguageRefresh(lang: string) {
    this.translationService
      .setLanguage(lang)
      .subscribe((response) => {
        this.setLanguageWithRefresh(response['LANGUAGE']);
      });
    this.defaultFlag = this.languages.find(c => c.lang == lang)?.flag;
  }

  setTopLogAndName() {
    this.securityService.SecurityObject.subscribe((c) => {
      if (c) {
        this.appUserAuth = c;
      }
    });
  }

  getNotification() {
    if (!this.securityService.isUserAuthenticate()) {
      return;
    }

    this.notificationService
      .getNotification()
      .subscribe((notifications: UserNotification[]) => {
        this.newNotificationCount = notifications.filter(
          (c) => !c.isRead
        ).length;
        this.notifications = notifications;
        this.cd.detectChanges();

        setTimeout(() => {
          this.getNotification();
        }, this.refereshReminderTimeInMinute * 60 * 1000);
      });
  }

  markAllAsReadNotification() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.getNotification();
    });
  }

  mobileMenuSidebarOpen(event: Event, className: string) {
    const hasClass = (event.target as HTMLInputElement).classList.contains(
      className
    );
    if (hasClass) {
      this.renderer.removeClass(this.document.body, className);
    } else {
      this.renderer.addClass(this.document.body, className);
    }
  }

  callSidemenuCollapse() {
    const hasClass = this.document.body.classList.contains('side-closed');
    if (hasClass) {
      this.renderer.removeClass(this.document.body, 'side-closed');
      this.renderer.removeClass(this.document.body, 'submenu-closed');
    } else {
      this.renderer.addClass(this.document.body, 'side-closed');
      this.renderer.addClass(this.document.body, 'submenu-closed');
    }
  }

  viewNotification(notification: UserNotification) {
    if (!notification.isRead) {
      this.markAsReadNotification(notification.id);
    }

    if (notification.documentId) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['reminders']);
    }
  }

  markAsReadNotification(id) {
    this.notificationService.markAsRead(id).subscribe(() => {
      this.getNotification();
    });
  }

  onProfileClick() {
    this.router.navigate(['my-profile']);
  }

  logout() {
    this.securityService.logout();
  }
}
