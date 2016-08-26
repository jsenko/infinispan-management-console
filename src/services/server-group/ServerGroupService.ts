import {App} from "../../ManagementConsole";
import {DmrService} from "../dmr/DmrService";
import {IDmrRequest} from "../dmr/IDmrRequest";
import {IServerGroup} from "./IServerGroup";
import {IMap} from "../utils/IMap";
import {UtilsService} from "../utils/UtilsService";
import {ServerAddress} from "../server/ServerAddress";
import {DomainService} from "../domain/DomainService";
import {JGroupsService} from "../jgroups/JGroupsService";
import {IServerAddress} from "../server/IServerAddress";
import {ServerService} from "../server/ServerService";
import IQService = angular.IQService;

const module: ng.IModule = App.module("managementConsole.services.server-group", []);

export class ServerGroupService {

  static $inject: string[] = ["$q", "dmrService", "domainService", "jGroupsService", "serverService", "utils"];

  static parseServerGroup(name: string, object: any, members?: IServerAddress[]): IServerGroup {
    return <IServerGroup> {
      name: name,
      profile: object.profile,
      "socket-binding-group": object["socket-binding-group"],
      "socket-binding-port-offset": object["socket-binding-port-offset"],
      members: (members != null && members !== undefined) ? members : []
    };
  }

  constructor(private $q: IQService, private dmrService: DmrService, private domainService: DomainService,
              private jGroupsService: JGroupsService, private serverService: ServerService,
              private utils: UtilsService) {
  }

  getAllServerGroupsMap(): ng.IPromise<IMap<IServerGroup>> {
    let request: IDmrRequest = <IDmrRequest> {
      address: [],
      "child-type": "server-group"
    };

    let deferred: ng.IDeferred<IMap<IServerGroup>> = this.$q.defer<IMap<IServerGroup>>();
    this.dmrService.readChildResources(request).then((serverGroups: any) => {
      let map: IMap<IServerGroup> = <IMap<IServerGroup>>{};
      for (let serverGroupName in serverGroups) {
        let serverGroup: any = serverGroups[serverGroupName];
        map[serverGroupName] = ServerGroupService.parseServerGroup(serverGroupName, serverGroup);
      }
      deferred.resolve(map);
    });
    return deferred.promise;
  }

  getAllServerGroupsMapWithMembers(): ng.IPromise<IMap<IServerGroup>> {
    let request: IDmrRequest = <IDmrRequest>{
      address: [],
      "child-type": "host",
      "recursive-depth": 1
    };

    let deferred: ng.IDeferred<IMap<IServerGroup>> = this.$q.defer<IMap<IServerGroup>>();
    this.getAllServerGroupsMap()
      .then((map) => {
        this.dmrService.readChildResources(request).then((response) => {
          // Iterate all hosts and servers, populating allServerGroups map as we go
          for (let host in response) {
            let serverConfig: any = response[host]["server-config"];
            for (let server in serverConfig) {
              let serverGroupName: string = serverConfig[server].group;
              let serverGroup: IServerGroup = map[serverGroupName];
              serverGroup.members.push(new ServerAddress(host, server));
            }
          }
          deferred.resolve(map);
        });
      });
    return deferred.promise;
  }

  // Here we just wrap the getAll.. methods as it still requires the same number of http requests
  getServerGroupMapWithMembers(serverGroup: string): ng.IPromise<IServerGroup> {
    let deferred: ng.IDeferred<IServerGroup> = this.$q.defer<IServerGroup>();
    this.getAllServerGroupsMapWithMembers().then((serverGroups) => deferred.resolve(serverGroups[serverGroup]));
    return deferred.promise;
  }

  getServerGroupByProfile(profile: string): ng.IPromise<IServerGroup> {
    let request: IDmrRequest = <IDmrRequest>{
      address: [],
      "child-type": "server-group"
    };
    let deferred: ng.IDeferred<IServerGroup> = this.$q.defer<IServerGroup>();
    this.getAllServerGroupsMapWithMembers().then((sgMap) => {
      this.dmrService.readChildResources(request).then((serverGroups: any) => {
        for (let serverGroupName in serverGroups) {
          let serverGroup: any = sgMap[serverGroupName];
          if (serverGroup.profile === profile) {
            deferred.resolve(serverGroup);
            return;
          }
        }
      });
    });
    return deferred.promise;
  }

  areAllServerViewsTheSame(serverGroup: IServerGroup): ng.IPromise<boolean> {
    let deferred: ng.IDeferred<boolean> = this.$q.defer<boolean>();
    let promises: ng.IPromise<IServerAddress>[] = [];

    for (let server of serverGroup.members) {
      promises.push(this.jGroupsService.getCoordinatorByServer(server, serverGroup.profile));
    }

    this.$q.all(promises).then((views: [IServerAddress]) => {
      if (views.length === 1) {
        deferred.resolve(true);
        return;
      }
      let firstView: IServerAddress = views[0];
      deferred.resolve(views.every((view) => firstView.equals(view)));
    });
    return deferred.promise;
  }

  // Can't set IMap key type to anything other than string/number, so we use ServerAddress.toString as key/string
  getServerStatuses(serverGroup: IServerGroup): ng.IPromise<IMap<string>> {
    return this.getStringFromAllMembers(serverGroup, (server) => this.serverService.getServerStatus(server));
  }

  getServerInetAddress(serverGroup: IServerGroup): ng.IPromise<IMap<string>> {
    return this.getStringFromAllMembers(serverGroup, (server) => this.serverService.getServerInetAddress(server));
  }

  private getStringFromAllMembers(serverGroup: IServerGroup,
                                  serviceCall: (server: IServerAddress) => ng.IPromise<string>): ng.IPromise<IMap<string>> {
    let deferred: ng.IDeferred<IMap<string>> = this.$q.defer<IMap<string>>();
    let servers: ServerAddress[] = serverGroup.members;
    let promises: ng.IPromise<string>[] = servers.map(serviceCall);

    this.$q.all(promises).then((statuses: string[]) => {
      let statusMap: IMap<string> = {};
      servers.forEach((server) => statusMap[server.toString()] = statuses.shift());
      deferred.resolve(statusMap);
    });
    return deferred.promise;
  }
}

module.service("serverGroupService", ServerGroupService);
