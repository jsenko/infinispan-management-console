import {App} from "../../ManagementConsole";
import {CacheCtrl} from "./CacheCtrl";
import {CacheService} from "../../services/cache/CacheService";
import {ContainerService} from "../../services/container/ContainerService";
import {ICacheContainer} from "../../services/container/ICacheContainer";
import {ICache} from "../../services/cache/ICache";
import {CacheNodesCtrl} from "./CacheNodesCtrl";
import {CacheConfigCtrl} from "./config/CacheConfigCtrl";
import {isNotNullOrUndefined} from "../../common/utils/Utils";
import {QueryCtrl} from "./QueryCtrl";

const module: ng.IModule = App.module("managementConsole.cache", []);

module.controller("CacheCtrl", CacheCtrl);
module.controller("CacheCtrl", CacheNodesCtrl);
module.controller("QueryCtrl", QueryCtrl);

// @ngInject
module.config(($stateProvider: ng.ui.IStateProvider) => {
  $stateProvider.state("cache", {
    parent: "root",
    url: "containers/:profileName/:containerName/caches/:cacheType/:cacheName",
    templateUrl: "module/cache/view/cache.html",
    controller: CacheCtrl,
    controllerAs: "ctrl",
    resolve: {
      container: ["$stateParams", "containerService",
        ($stateParams, containerService: ContainerService) => {
          return containerService.getContainer($stateParams.containerName, $stateParams.profileName);
        }],
      cache: ["$stateParams", "cacheService", "container",
        ($stateParams, cacheService: CacheService, container: ICacheContainer) => {
          return cacheService.getCacheWithConfiguration(container, $stateParams.cacheType, $stateParams.cacheName);
        }],
      stats: ["$stateParams", "container", "cache", "cacheService",
        ($stateParams, container: ICacheContainer, cache: ICache, cacheService: CacheService) => {
          return cacheService.getCacheStats(container, cache);
        }],
      availability: ["container", "cache", "cacheService",
        (container: ICacheContainer, cache: ICache, cacheService: CacheService) => {
          return cacheService.availability(container, cache);
        }],
      cacheEnabledRSP: ["$stateParams", "container", "cache", "cacheService",
        ($stateParams, container: ICacheContainer, cache: ICache, cacheService: CacheService) => {
          return cacheService.isEnabled(container.profile, cache);
        }],
    }
  });

  $stateProvider.state("edit-cache-config", {
    parent: "root",
    url: "containers/:profileName/:containerName/caches/:cacheType/:cacheName/config",
    controller: CacheConfigCtrl,
    controllerAs: "ctrl",
    templateUrl: "module/cache/config/view/cache-config.html",
    resolve: {
      container: ["$stateParams", "containerService", ($stateParams, containerService) => {
        return containerService.getContainer($stateParams.containerName, $stateParams.profileName);
      }],
      template: ["$stateParams", "cacheService", "container", ($stateParams, cacheService, container) => {
        return cacheService.getCacheTemplate(container, $stateParams.cacheType, $stateParams.cacheName);
      }],
      meta: ["$stateParams", "container", "cacheConfigService", ($stateParams, container, cacheConfigService) => {
        return cacheConfigService.getConfigurationMeta(container, $stateParams.cacheType);
      }],
      cacheName: ["$stateParams", ($stateParams) => $stateParams.cacheName]
    }
  });

  $stateProvider.state("new-cache-config", {
    parent: "root",
    url: "containers/:profileName/:containerName/caches/new?cacheType&cacheName&baseTemplate",
    controller: CacheConfigCtrl,
    controllerAs: "ctrl",
    templateUrl: "module/cache/config/view/cache-config.html",
    resolve: {
      container: ["$stateParams", "containerService", ($stateParams, containerService) => {
        return containerService.getContainer($stateParams.containerName, $stateParams.profileName);
      }],
      template: ["$q", "$stateParams", "container", "cacheConfigService",
        ($q: ng.IQService, $stateParams, container, cacheConfigService) => {
          let deferred: ng.IDeferred<any> = $q.defer<any>();
          if (isNotNullOrUndefined($stateParams.cacheType) && isNotNullOrUndefined($stateParams.baseTemplate)) {
            cacheConfigService.getTemplate(container, $stateParams.cacheType, $stateParams.baseTemplate)
              .then(template => {
                template.name = $stateParams.cacheName;
                template["template-name"] = $stateParams.cacheName;
                template.baseTemplate = $stateParams.baseTemplate;
                deferred.resolve(template);
              });
            return deferred.promise;
          } else {
            deferred.resolve({
              name: $stateParams.name,
              type: cacheConfigService.getDefaultCacheType(),
              mode: "SYNC",
              "template-name": $stateParams.cacheName
            });
          }
          return deferred.promise;
        }],
      meta: ["container", "template", "cacheConfigService", (container, template, cacheConfigService) => {
        return cacheConfigService.getConfigurationMeta(container, template.type);
      }],
      cacheName: ["$stateParams", ($stateParams) => $stateParams.cacheName]
    }
  });

  $stateProvider.state("caches-node-stats", {
    parent: "root",
    url: "containers/:profileName/:containerName/caches/:cacheType/:cacheName/nodes",
    templateUrl: "module/cache/view/nodes.html",
    controller: CacheNodesCtrl,
    controllerAs: "ctrl",
    resolve: {
      container: ["$stateParams", "containerService",
        ($stateParams, containerService: ContainerService) => {
          return containerService.getContainer($stateParams.containerName, $stateParams.profileName);
        }],
      cache: ["$stateParams", "cacheService", "container",
        ($stateParams, cacheService: CacheService, container: ICacheContainer) => {
          return cacheService.getCacheWithConfiguration(container, $stateParams.cacheType, $stateParams.cacheName);
        }],
      allCacheStats: ["cacheService", "container", "cache",
        (cacheService: CacheService, container: ICacheContainer, cache: ICache) => {
          return cacheService.getCacheStatsForServers(container, cache);
        }]
    }
  });

  $stateProvider.state("caches-query", {
        parent: "root",
        url: "containers/:profileName/:containerName/caches/:cacheType/:cacheName/query",
        templateUrl: "module/cache/view/query.html",
        controller: QueryCtrl,
        controllerAs: "ctrl",
        resolve: {
          container: ["$stateParams", "containerService",
            ($stateParams, containerService: ContainerService) => {
                return containerService.getContainer($stateParams.containerName, $stateParams.profileName);
            }],
          cache: ["$stateParams", "cacheService", "container",
            ($stateParams, cacheService: CacheService, container: ICacheContainer) => {
                return cacheService.getCacheWithConfiguration(container, $stateParams.cacheType, $stateParams.cacheName);
            }],
          allCacheStats: ["cacheService", "container", "cache",
            (cacheService: CacheService, container: ICacheContainer, cache: ICache) => {
                return cacheService.getCacheStatsForServers(container, cache);
            }]
        }
    });
});
