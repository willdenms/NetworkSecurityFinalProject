/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-2016 Eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

(function(global)
{
  function EventEmitter()
  {
    this._listeners = Object.create(null);
  }
  EventEmitter.prototype = {
    on: function(name, listener)
    {
      if (name in this._listeners)
        this._listeners[name].push(listener);
      else
        this._listeners[name] = [listener];
    },
    off: function(name, listener)
    {
      var listeners = this._listeners[name];
      if (listeners)
      {
        var idx = listeners.indexOf(listener);
        if (idx != -1)
          listeners.splice(idx, 1);
      }
    },
    emit: function(name)
    {
      var listeners = this._listeners[name];
      if (listeners)
      {
        for (var i = 0; i < listeners.length; i++)
          listeners[i].apply(null, Array.prototype.slice.call(arguments, 1));
      }
    }
  };

  function updateFromURL(data)
  {
    if (window.location.search)
    {
      var params = window.location.search.substr(1).split("&");
      for (var i = 0; i < params.length; i++)
      {
        var parts = params[i].split("=", 2);
        if (parts.length == 2 && parts[0] in data)
          data[parts[0]] = decodeURIComponent(parts[1]);
      }
    }
  }

  var params = {
    blockedURLs: "",
    filterlistsReinitialized: false,
    addSubscription: false,
    filterError: false,
    downloadStatus: "synchronize_ok",
    showNotificationUI: false,
    safariContentBlocker: false
  };
  updateFromURL(params);

  var modules = {};
  global.require = function(module)
  {
    return modules[module];
  };

  modules.utils = {
    Utils: {
      getDocLink: function(link)
      {
        return "https://adblockplus.org/redirect?link=" + encodeURIComponent(link);
      },
      get appLocale()
      {
        return parent.ext.i18n.getMessage("@@ui_locale").replace(/_/g, "-");
      }
    }
  };

  modules.prefs = {Prefs: new EventEmitter()};
  var prefs = {
    notifications_ignoredcategories: (params.showNotificationUI) ? ["*"] : [],
    notifications_showui: params.showNotificationUI,
    safari_contentblocker: false,
    shouldShowBlockElementMenu: true,
    show_devtools_panel: true,
    subscriptions_exceptionsurl: "https://easylist-downloads.adblockplus.org/exceptionrules.txt"
  };
  Object.keys(prefs).forEach(function(key)
  {
    Object.defineProperty(modules.prefs.Prefs, key, {
      get: function()
      {
        return prefs[key];
      },
      set: function(value)
      {
        prefs[key] = value;
        modules.prefs.Prefs.emit(key);
      }
    });
  });

  modules.notification = {
    Notification: {
      toggleIgnoreCategory: function(category)
      {
        var categories = prefs.notifications_ignoredcategories;
        var index = categories.indexOf(category);
        if (index == -1)
          categories.push(category);
        else
          categories.splice(index, 1);
        modules.prefs.Prefs.notifications_ignoredcategories = categories;
      }
    }
  };

  modules.subscriptionClasses = {
    Subscription: function(url)
    {
      this.url = url;
      this._disabled = false;
      this._lastDownload = 1234;
      this.homepage = "https://easylist.adblockplus.org/";
      this.downloadStatus = params.downloadStatus;
    },

    SpecialSubscription: function(url)
    {
      this.url = url;
      this.disabled = false;
      this.filters = knownFilters.slice();
    }
  };
  modules.subscriptionClasses.Subscription.fromURL = function(url)
  {
    if (url in knownSubscriptions)
      return knownSubscriptions[url];

    if (/^https?:\/\//.test(url))
      return new modules.subscriptionClasses.Subscription(url);
    else
      return new modules.subscriptionClasses.SpecialSubscription(url);
  };
  modules.subscriptionClasses.DownloadableSubscription = modules.subscriptionClasses.Subscription;

  modules.subscriptionClasses.Subscription.prototype =
  {
    get disabled()
    {
      return this._disabled;
    },
    set disabled(value)
    {
      this._disabled = value;
      modules.filterNotifier.FilterNotifier.emit("subscription.disabled", this);
    },
    get lastDownload()
    {
      return this._lastDownload;
    },
    set lastDownload(value)
    {
      this._lastDownload = value;
      modules.filterNotifier.FilterNotifier.emit("subscription.lastDownload", this);
    }
  };


  modules.filterStorage = {
    FilterStorage: {
      get subscriptions()
      {
        var subscriptions = [];
        for (var url in modules.filterStorage.FilterStorage.knownSubscriptions)
          subscriptions.push(modules.filterStorage.FilterStorage.knownSubscriptions[url]);
        return subscriptions;
      },

      get knownSubscriptions()
      {
        return knownSubscriptions;
      },

      addSubscription: function(subscription)
      {
        if (!(subscription.url in modules.filterStorage.FilterStorage.knownSubscriptions))
        {
          knownSubscriptions[subscription.url] = modules.subscriptionClasses.Subscription.fromURL(subscription.url);
          modules.filterNotifier.FilterNotifier.emit("subscription.added", subscription);
        }
      },

      removeSubscription: function(subscription)
      {
        if (subscription.url in modules.filterStorage.FilterStorage.knownSubscriptions)
        {
          delete knownSubscriptions[subscription.url];
          modules.filterNotifier.FilterNotifier.emit("subscription.removed", subscription);
        }
      },

      addFilter: function(filter)
      {
        for (var i = 0; i < customSubscription.filters.length; i++)
        {
          if (customSubscription.filters[i].text == filter.text)
            return;
        }
        customSubscription.filters.push(filter);
        modules.filterNotifier.FilterNotifier.emit("filter.added", filter);
      },

      removeFilter: function(filter)
      {
        for (var i = 0; i < customSubscription.filters.length; i++)
        {
          if (customSubscription.filters[i].text == filter.text)
          {
            customSubscription.filters.splice(i, 1);
            modules.filterNotifier.FilterNotifier.emit("filter.removed", filter);
            return;
          }
        }
      }
    }
  };

  modules.filterClasses = {
    BlockingFilter: function() {},
    Filter: function(text)
    {
      this.text = text;
      this.disabled = false;
    },
    RegExpFilter: function() {}
  };
  modules.filterClasses.Filter.fromText = function(text)
  {
    return new modules.filterClasses.Filter(text);
  };
  modules.filterClasses.RegExpFilter.typeMap = Object.create(null);

  modules.filterValidation = 
  {
    parseFilter: function(text)
    {
      if (params.filterError)
        return {error: "Invalid filter"};
      return {filter: modules.filterClasses.Filter.fromText(text)};
    },
    parseFilters: function(text)
    {
      if (params.filterError)
        return {errors: ["Invalid filter"]};
      return {
        filters: text.split("\n")
          .filter(function(filter) {return !!filter;})
          .map(modules.filterClasses.Filter.fromText),
        errors: []
      };
    }
  };

  modules.synchronizer = {
    Synchronizer: {
      _downloading: false,
      execute: function(subscription, manual) 
      {
        modules.synchronizer.Synchronizer._downloading = true;
        modules.filterNotifier.FilterNotifier.emit(
          "subscription.downloading", subscription
        );
        setTimeout(function()
        {
          modules.synchronizer.Synchronizer._downloading = false;
          subscription.lastDownload = Date.now() / 1000;
        }, 500);
      },
      isExecuting: function(url)
      {
        return modules.synchronizer.Synchronizer._downloading;
      }
    }
  };

  modules.matcher = {
    defaultMatcher: {
      matchesAny: function(url, requestType, docDomain, thirdParty)
      {
        var blocked = params.blockedURLs.split(",");
        if (blocked.indexOf(url) >= 0)
          return new modules.filterClasses.BlockingFilter();
        else
          return null;
      }
    }
  };

  modules.cssRules = {
    CSSRules: {
      getRulesForDomain: function(domain) { }
    }
  };

  modules.filterNotifier = {
    FilterNotifier: new EventEmitter()
  };

  modules.info = {
    platform: "gecko",
    platformVersion: "34.0",
    application: "firefox",
    applicationVersion: "34.0",
    addonName: "adblockplus",
    addonVersion: "2.6.7"
  };
  updateFromURL(modules.info);

  modules.subscriptionInit = {
    reinitialized: params.filterlistsReinitialized
  };

  global.Services = {
    vc: {
      compare: function(v1, v2)
      {
        return parseFloat(v1) - parseFloat(v2);
      }
    }
  };

  var filters = [
    "@@||alternate.de^$document",
    "@@||der.postillion.com^$document",
    "@@||taz.de^$document",
    "@@||amazon.de^$document",
    "||biglemon.am/bg_poster/banner.jpg",
    "winfuture.de###header_logo_link",
    "###WerbungObenRechts10_GesamtDIV",
    "###WerbungObenRechts8_GesamtDIV",
    "###WerbungObenRechts9_GesamtDIV",
    "###WerbungUntenLinks4_GesamtDIV",
    "###WerbungUntenLinks7_GesamtDIV",
    "###WerbungUntenLinks8_GesamtDIV",
    "###WerbungUntenLinks9_GesamtDIV",
    "###Werbung_Sky",
    "###Werbung_Wide",
    "###__ligatus_placeholder__",
    "###ad-bereich1-08",
    "###ad-bereich1-superbanner",
    "###ad-bereich2-08",
    "###ad-bereich2-skyscrapper"
  ];
  var knownFilters = filters.map(modules.filterClasses.Filter.fromText);

  var subscriptions = [
    "https://easylist-downloads.adblockplus.org/easylistgermany+easylist.txt",
    "https://easylist-downloads.adblockplus.org/exceptionrules.txt",
    "https://easylist-downloads.adblockplus.org/fanboy-social.txt",
    "~user~786254"
  ];
  var knownSubscriptions = Object.create(null);
  for (var subscriptionUrl of subscriptions)
    knownSubscriptions[subscriptionUrl] = modules.subscriptionClasses.Subscription.fromURL(subscriptionUrl);
  var customSubscription = knownSubscriptions["~user~786254"];

  if (params.addSubscription)
  {
    // We don't know how long it will take for the page to fully load
    // so we'll post the message after one second
    setTimeout(function()
    {
      window.postMessage({
        type: "message",
        payload: {
          title: "Custom subscription",
          url: "http://example.com/custom.txt",
          confirm: true,
          type: "subscriptions.add"
        }
      }, "*");
    }, 1000);
  }

  ext.devtools.onCreated.addListener(function(panel)
  {
    // blocked request
    panel.sendMessage({
      type: "add-record",
      request: {
        url: "http://adserver.example.com/ad_banner.png",
        type: "IMAGE",
        docDomain: "example.com"
      },
      filter: {
        text: "/ad_banner*$domain=example.com",
        whitelisted: false,
        userDefined: false,
        subscription: "EasyList"
      }
    });

    // whitelisted request
    panel.sendMessage({
      type: "add-record",
      request: {
        url: "http://example.com/looks_like_an_ad_but_isnt_one.html",
        type: "SUBDOCUMENT",
        docDomain: "example.com"
      },
      filter: {
        text: "@@||example.com/looks_like_an_ad_but_isnt_one.html",
        whitelisted: true,
        userDefined: false,
        subscription: "EasyList"
      }
    });

    // request with long URL and no filter matches
    panel.sendMessage({
      type: "add-record",
      request: {
        url: "https://this.url.has.a.long.domain/and_a_long_path_maybe_not_long_enough_so_i_keep_typing?there=are&a=couple&of=parameters&as=well&and=even&some=more",
        type: "XMLHTTPREQUEST",
        docDomain: "example.com"
      },
      filter: null
    });

    // matching element hiding filter
    panel.sendMessage({
      type: "add-record",
      request: {
        type: "ELEMHIDE",
        docDomain: "example.com"
      },
      filter: {
        text: "example.com##.ad_banner",
        whitelisted: false,
        userDefined: false,
        subscription: "EasyList"
      }
    });

    // user-defined filter
    panel.sendMessage({
      type: "add-record",
      request: {
        url: "http://example.com/some-annoying-popup",
        type: "POPUP",
        docDomain: "example.com"
      },
      filter: {
        text: "||example.com/some-annoying-popup$popup",
        whitelisted: false,
        userDefined: true,
        subscription: null
      }
    });
  });

  if (params.safariContentBlocker)
  {
    global.safari = {
      extension: {
        setContentBlocker: function() {}
      }
    };
  }
})(this);
