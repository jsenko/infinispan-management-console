import {App} from "../../ManagementConsole";
import {DmrService} from "../dmr/DmrService";
import IPromise = angular.IPromise;
import {IDmrRequest} from "../dmr/IDmrRequest";
import IQService = angular.IQService;
import {LaunchTypeService} from "../launchtype/LaunchTypeService";
import {StandaloneService} from "../standalone/StandaloneService";
import {isNotNullOrUndefined, deepGet} from "../../common/utils/Utils";

const module: ng.IModule = App.module("managementConsole.services.profile", []);

export class ProfileService {

  static $inject: string[] = ["$q", "dmrService", "launchType"];

  constructor(private $q: IQService, private dmrService: DmrService, private launchType: LaunchTypeService) {
  }

  getAllProfileNames(): IPromise<string[]> {
    let deferred: ng.IDeferred<string[]> = this.$q.defer();
    if (this.launchType.isLaunchTypeInitialised()) {
      this.getProfileNames()
        .then(names => deferred.resolve(names), error => deferred.reject(error));
    } else {
      // This should only happen if the user goes to / before authenticating and a redirect occurs
      this.launchType.get().then(
        () => this.getProfileNames().then(
          names => deferred.resolve(names),
          error => deferred.reject(error)),
        error => deferred.reject(error));
    }
    return deferred.promise;
  }

  getAllProfileNamesDomain(): IPromise<string[]> {
    let request: IDmrRequest = <IDmrRequest>{
      address: [],
      "child-type": "profile",
      "recursive-depth": 1
    };
    let deferred: ng.IDeferred<string[]> = this.$q.defer<string[]>();
    this.dmrService.readChildResources(request).then(response => {
      let profiles: string[] = [];
      for (let key in response) {
        let path: string = key + ".subsystem.datagrid-infinispan";
        if (isNotNullOrUndefined(deepGet(response, path))) {
          profiles.push(key);
        }
      }
      deferred.resolve(profiles);
    });
    return deferred.promise;
  }

  getAllProfileNamesStandalone(): IPromise<string[]> {
    let deferred: ng.IDeferred<string[]> = this.$q.defer<string[]>();
    deferred.resolve([StandaloneService.PROFILE_NAME]);
    return deferred.promise;
  }

  private getProfileNames(): IPromise<string[]> {
    if (this.launchType.isDomainMode()) {
      return this.getAllProfileNamesDomain();
    } else if (this.launchType.isStandaloneMode()) {
      return this.getAllProfileNamesStandalone();
    }
  }
}

module.service("profileService", ProfileService);
