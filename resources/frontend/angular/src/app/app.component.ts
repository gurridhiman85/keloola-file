import { Component } from '@angular/core';
import { Event, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { TranslationService } from '@core/services/translation.service';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  currentUrl!: string;
  constructor(public _router: Router,
    public translate: TranslateService,
    private translationService: TranslationService) {
    translate.addLangs(['en']);
    translate.setDefaultLang('en');
    this.setLanguage();

    this._router.events.subscribe((routerEvent: Event) => {
      if (routerEvent instanceof NavigationStart) {
        this.currentUrl = routerEvent.url.substring(
          routerEvent.url.lastIndexOf('/') + 1
        );
      }
      if (routerEvent instanceof NavigationEnd) {
        /* empty */
      }
      window.scrollTo(0, 0);
    });
  }

  setLanguage() {
    const currentLang = this.translationService.getSelectedLanguage();
    if (currentLang) {
      this.translationService
        .setLanguage(currentLang)
        .subscribe(() => { });
    } else {
      const browserLang = this.translate.getBrowserLang();
      const lang = browserLang.match(/en|es|ar|ru|cn|ja|ko|fr/)
        ? browserLang
        : 'en';
      this.translationService
        .setLanguage(lang)
        .subscribe(() => { });
    }
  }
}
