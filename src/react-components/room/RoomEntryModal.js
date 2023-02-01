import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { CheckboxInput } from "../input/CheckboxInput";
import { ReactComponent as EnterIcon } from "../icons/Enter.svg";
import { ReactComponent as VRIcon } from "../icons/VR.svg";
import { ReactComponent as ShowIcon } from "../icons/Show.svg";
import { ReactComponent as SettingsIcon } from "../icons/Settings.svg";
import styles from "./RoomEntryModal.scss";
import styleUtils from "../styles/style-utils.scss";
import { useCssBreakpoints } from "react-use-css-breakpoints";
import { Column } from "../layout/Column";
import { Row } from "../layout/Row";
import { AppLogo } from "../misc/AppLogo";
import { FormattedMessage } from "react-intl";

export function RoomEntryModal({
  className,
  roomName,
  showJoinRoom,
  onJoinRoom,
  showEnterOnDevice,
  onEnterOnDevice,
  showSpectate,
  onSpectate,
  showOptions,
  onOptions,
  ...rest
}) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const onAcceptTerms = useCallback(() => {
    setAcceptedTerms(state => !state);
  }, []);
  const AcceptTermsLabel = () => {
    return (
      <FormattedMessage
        id="room-entry-modal.agb-accept"
        defaultMessage="I confirm that I understand the legal note and disclaimer above and have taken note of and accept the above given terms of use and the privacy statement relating to the UBS website."
      />
    );
  };

  const breakpoint = useCssBreakpoints();
  return (
    <Modal className={classNames(styles.roomEntryModal, className)} disableFullscreen {...rest}>
      <Column center className={styles.content}>
        {breakpoint !== "sm" && breakpoint !== "md" && (
          <div className={styles.logoContainer}>
            <AppLogo />
          </div>
        )}
        <div className={styles.termsAndConditions}>
          <FormattedMessage
            id="room-entry-modal.agb-text"
            defaultMessage="<b>Terms and condit...:</b> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed aliquet magna eu erat bibendum, vehicula pharetra tortor ullamcorper. Morbi vel eleifend ante. Fusce aliquet ullamcorper porta. Ut non gravida nulla. Maecenas iaculis metus quis metus elementum, sit amet elementum ligula lobortis. Pellentesque imperdiet vitae justo sed accumsan. Fusce mollis egestas dui ut luctus."
            tagName="p"
            values={{ b: chunks => <b>{chunks}</b> }}
          />
          <CheckboxInput
            tabIndex="0"
            type="checkbox"
            checked={acceptedTerms}
            label={<AcceptTermsLabel />}
            onChange={onAcceptTerms}
            className={styles.termsAndConditionsCheckbox}
          />
        </div>
        <Row className={styles.buttons} flexClassName={styles.buttonsRow}>
          {showJoinRoom && (
            <Button preset="accent4" onClick={onJoinRoom} disabled={!acceptedTerms}>
              <EnterIcon />
              <span>
                <FormattedMessage id="room-entry-modal.join-room-button" defaultMessage="Join Room" />
              </span>
            </Button>
          )}
          {showEnterOnDevice && (
            <Button preset="accent5" onClick={onEnterOnDevice} disabled={!acceptedTerms}>
              <VRIcon />
              <span>
                <FormattedMessage id="room-entry-modal.enter-on-device-button" defaultMessage="Enter On Device" />
              </span>
            </Button>
          )}
          {showSpectate && (
            <Button preset="accent2" onClick={onSpectate} disabled={!acceptedTerms}>
              <ShowIcon />
              <span>
                <FormattedMessage id="room-entry-modal.spectate-button" defaultMessage="Spectate" />
              </span>
            </Button>
          )}
          {showOptions && breakpoint !== "sm" && (
            <>
              <hr className={styleUtils.showLg} />
              <Button preset="transparent" className={styleUtils.showLg} onClick={onOptions}>
                <SettingsIcon />
                <span>
                  <FormattedMessage id="room-entry-modal.options-button" defaultMessage="Options" />
                </span>
              </Button>
            </>
          )}
        </Row>
      </Column>
    </Modal>
  );
}

RoomEntryModal.propTypes = {
  className: PropTypes.string,
  roomName: PropTypes.string.isRequired,
  showJoinRoom: PropTypes.bool,
  onJoinRoom: PropTypes.func,
  showEnterOnDevice: PropTypes.bool,
  onEnterOnDevice: PropTypes.func,
  showSpectate: PropTypes.bool,
  onSpectate: PropTypes.func,
  showOptions: PropTypes.bool,
  onOptions: PropTypes.func
};

RoomEntryModal.defaultProps = {
  showJoinRoom: true,
  showEnterOnDevice: true,
  showSpectate: true,
  showOptions: true
};
