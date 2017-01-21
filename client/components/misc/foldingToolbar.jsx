import React, { Component, PropTypes } from 'react';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import bindHandlers from '_utils/bindHandlers';
import isPlainClick from '_utils/isPlainClick';
import classnames from 'classnames';

import styles from './foldingToolbar.css';

import Icon from './icon';

class FoldingToolbar extends Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
    bindHandlers(this);
  }
  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }
  onOpenHandler(ev) {
    if (isPlainClick(ev)) this.setState({ open: true });
    this.timer = setTimeout(() => this.close(), 10000);
  }
  onClickHandler(ev) {
    if (isPlainClick(ev)) {
      if (this.timer) clearTimeout(this.timer);
      this.close();
    }
  }
  close() {
    this.setState({ open: false });
    this.timer = null;
  }
  render() {
    return (<div className={classnames(this.props.className, styles.right)}>
      {
        this.state.open
        ? (
          <ButtonGroup
            style={{
              position: 'absolute',
              right: '1em',
            }}
            onClick={this.onClickHandler}
          >
            {this.props.children}
          </ButtonGroup>
        )
        : null
      }
      <Icon
        button
        onClick={this.onOpenHandler}
        style={{ visibility: (this.state.open ? 'hidden' : 'visible') }}
        type="menu-hamburger"
      />
    </div>);
  }
}

FoldingToolbar.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export default FoldingToolbar;
