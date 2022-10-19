import { isLocalHubsUrl, isHubsRoomUrl } from "../utils/media-url-utils";
import { handleExitTo2DInterstitial } from "../utils/vr-interstitial";
import { changeHub } from "../change-hub";

AFRAME.registerComponent("open-room-button", {
  init() {
    this.label = this.el.querySelector("[text]");

    if (!this.el.parentNode) return; // If removed
    const link = this.el.parentNode.parentNode.components["room-link"].data;
    this.src = link.src;
    this.label.setAttribute("text", "value", link.text);

    this.onClick = async () => {
      const exitImmersive = async () => await handleExitTo2DInterstitial(false, () => {}, true);

      let hubId;
      if ((hubId = await isHubsRoomUrl(this.src))) {
        const url = new URL(this.src);
        if (url.hash && window.APP.hub.hub_id === hubId) {
          // move to waypoint w/o writing to history
          window.history.replaceState(null, null, window.location.href.split("#")[0] + url.hash);
        } else if (APP.store.state.preferences.fastRoomSwitching && isLocalHubsUrl(this.src)) {
          // move to new room without page load or entry flow
          changeHub(hubId);
        } else {
          await exitImmersive();
          location.href = this.src;
        }
      }
    };
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
