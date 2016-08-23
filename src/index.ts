import {App} from "./ManagementConsole";
import "./services/authentication/AuthenticationService";
import "./services/cache/CacheService";
import "./services/container/ContainerService";
import "./services/dmr/DmrService";
import "./services/domain/DomainService";
import "./services/endpoint/EndpointService";
import "./services/jgroups/JGroupsService";
import "./services/launchtype/LaunchTypeService";
import "./services/profile/ProfileService";
import "./services/server-group/ServerGroupService";
import "./services/socket-binding/SocketBindingService";
import "./services/utils/UtilsService";
import "./module/auth/Auth";
import "./module/clusters/Clusters";
import "./module/navbar/Navbar";

App.element(document).ready(() => {
  App.bootstrap(document, [
    "managementConsole",
    "managementConsole.auth",
    "managementConsole.clusters",
    "managementConsole.navbar",
    "managementConsole.services.authentication",
    "managementConsole.services.cache",
    "managementConsole.services.container",
    "managementConsole.services.dmr",
    "managementConsole.services.domain",
    "managementConsole.services.endpoint",
    "managementConsole.services.jgroups",
    "managementConsole.services.launchtype",
    "managementConsole.services.profile",
    "managementConsole.services.server-group",
    "managementConsole.services.socket-binding",
    "managementConsole.services.utils"
  ]);
});