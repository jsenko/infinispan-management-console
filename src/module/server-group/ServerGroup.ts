import {App} from "../../ManagementConsole";
import "../../services/dmr/DmrService";
import {ServerGroupCtrl} from "./ServerGroupCtrl";
import {serverFilter} from "./ServerGroupFilter";

const module: ng.IModule = App.module("managementConsole.server-group", []);

module.controller("ServerGroupCtrl", ServerGroupCtrl);
module.filter("serverFilter", serverFilter);

// @ngInject
module.config(($stateProvider: ng.ui.IStateProvider) => {
  $stateProvider.state("server-group", {
    url: "/server-groups/:serverGroup",
    views: {
      application: {
        templateUrl: "module/server-group/view/server-group.html",
        controller: ServerGroupCtrl,
        controllerAs: "ctrl",
        params: {
          serverGroup: null,
          refresh: false
        },
        resolve: {
          serverGroup: ["$stateParams", "serverGroupService", ($stateParams, serverGroupService) => {
            // TODO add serverGroup object as optional parameter and if exists don't call service again unless refresh is true
            let serverGroup: string =  $stateParams.serverGroup;
            return serverGroupService.getServerGroupMapWithMembers(serverGroup);
          }]
        }
      }
    }
  });
});
