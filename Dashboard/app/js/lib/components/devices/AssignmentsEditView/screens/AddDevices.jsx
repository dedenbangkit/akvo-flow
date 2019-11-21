/* eslint-disable import/no-unresolved */
import React from 'react';
import { groupBy as _groupBy } from 'lodash';
import DeviceGroupSelectorView from 'akvo-flow/components/selectors/DeviceSelector';

import AssignmentsContext from '../assignment-context';

export default class AddDevice extends React.Component {
  state = {
    deviceGroups: {},
    selectedDevices: [],
  };

  componentDidMount() {
    // filter out selected devices
    const { devices, selectedDevices } = this.context.data;

    const filteredDevices = devices.filter(
      device => !selectedDevices.includes(device.id)
    );

    this.setState({
      deviceGroups: _groupBy(filteredDevices, device => device.deviceGroup.id),
    });
  }

  onSelectDevice = (id, checked) => {
    const { selectedDevices } = this.state;

    if (checked) {
      this.setState({
        selectedDevices: selectedDevices.concat(id),
      });
    } else {
      this.setState({
        selectedDevices: selectedDevices.filter(device => device !== id),
      });
    }
  };

  render() {
    const { deviceGroups, selectedDevices } = this.state;

    return (
      <div className="add-devices">
        <div className="header">
          <p>Add devices to assignment</p>
          <i className="fa fa-times" />
        </div>

        <div className="body">
          <div className="assignment-device-selector">
            <DeviceGroupSelectorView
              deviceGroups={deviceGroups}
              handleSelectDevice={this.onSelectDevice}
              selectedDevices={selectedDevices}
            />
          </div>
        </div>

        <div className="footer">
          <div className="footer-inner">
            <div>
              <p>{selectedDevices.length} selected</p>
            </div>

            <button
              type="button"
              className={`btnOutline ${
                selectedDevices.length === 0 ? 'disabled' : ''
              }`}
            >
              Add to assignment
            </button>
          </div>
        </div>
      </div>
    );
  }
}

AddDevice.contextType = AssignmentsContext;
