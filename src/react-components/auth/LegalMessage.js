import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import styles from "./LegalMessage.scss";

export function LegalMessage({ termsUrl, privacyUrl }) {
  const toslink = useCallback(
    chunks => (
      <a rel="noopener noreferrer" target="_blank" href={termsUrl}>
        {chunks}
      </a>
    ),
    [termsUrl]
  );

  const privacylink = useCallback(
    chunks => (
      <a rel="noopener noreferrer" target="_blank" href={privacyUrl}>
        {chunks}
      </a>
    ),
    [privacyUrl]
  );

  const [showTos, setShowTos] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const toggleElement = element => {
    if (element == "tos") {
      setShowPrivacy(false);
      setShowTos(!showTos);
    } else {
      setShowTos(false);
      setShowPrivacy(!showPrivacy);
    }
  };
  let terms, privacy;

  if (termsUrl) {
    terms = (
      <div className={styles.accordion_item}>
        <div onClick={() => toggleElement("tos")} className={styles.title}>
          <FormattedMessage id="legal-message.tos-note-title" defaultMessage="Legal Note" tagName="h3" />
        </div>
        {showTos && (
          <div className={styles.body}>
            <FormattedMessage
              id="legal-message.tos-note-text"
              defaultMessage='<p>The UBS metaverse environment is provided by UBS Europe SE, Luxembourg Branch ("UBS", "We"). By entering the UBS metaverse environment, you agree to be legally bound by the Terms of Use then in effect. Please also refer to the relevant additional legal information applicable to your country.</p><p>These Terms of Use as well as the information and materials contained in the UBS metaverse environment are subject to change at any time and from time to time, without notice. UBS may add features to or remove features from the UBS metaverse environment at any time and from time to time in our sole discretion. Continued access to the UBS metaverse environment following any modification in these Terms of Use will constitute your acceptance of the Terms of Use as modified.</p><p>If you do not agree to be bound by these Terms of Use, do not enter the UBS metaverse environment.</p><p><toslink>Terms of use</toslink></p><p>UBS Europe SE is a subsidiary of UBS AG.</p><p>UBS Europe SE is a credit institution in the form of a Societas Europaea, with place of business at D-60306 Frankfurt am Main, Bockenheimer Landstraße 2-4, incorporated in Germany and registered with the Register of Commerce of Frankfurt (HRB 107046).</p><p>UBS Europe SE, Luxembourg Branch (R.C.S. Luxembourg no. B209123), with place of business at 33A, Avenue J. F. Kennedy, L-1855 Luxembourg, is a branch of UBS Europe SE and supervised by the Luxembourg prudential supervisory authority, the Commission de surveillance du Secteur Financier, in its role as host member state authority.</p><p>Members of the Management Board of UBS Europe SE: Christine Novakovic (Chair), Heinrich Baer, Dr. Denise Bauer-Weiler, Pierre Chavenon, Georgia Paphiti and Tobias Vogel. Chair of the Supervisory Board of UBS Europe SE: Prof. Dr. Reto Francioni.</p>'
              tagName="div"
              values={{ p: chunks => <p>{chunks}</p>, toslink }}
            />
          </div>
        )}
      </div>
    );
  }
  if (privacyUrl) {
    privacy = (
      <div className={styles.accordion_item}>
        <div onClick={() => toggleElement("privacy-disclaimer")} className={styles.title}>
          <FormattedMessage
            id="legal-message.privacy-disclaimer-title"
            defaultMessage="Privacy Disclaimer"
            tagName="h3"
          />
        </div>
        {showPrivacy && (
          <div className={styles.body}>
            <FormattedMessage
              id="legal-message.privacy-disclaimer-text"
              defaultMessage='<p>This privacy disclaimer is issued by UBS Europe SE, Luxembourg Branch ("UBS", "We").</p><p>UBS appreciates your visit to this website and your interest in our services and products. Your privacy is of utmost importance to us. To understand how UBS processes your personal data, including how we protect your data, your rights in respect of your data and contact details of the Group DP Office, please refer to our Privacy Notice.</p><p><privacylink>Privacy statement</privacylink></p>'
              tagName="div"
              values={{ p: chunks => <p>{chunks}</p>, privacylink }}
            />
          </div>
        )}
      </div>
    );
  }
  return (
    <div className={styles.accordion}>
      {terms}
      {privacy}
    </div>
  );
}

LegalMessage.propTypes = {
  termsUrl: PropTypes.string,
  privacyUrl: PropTypes.string
};
