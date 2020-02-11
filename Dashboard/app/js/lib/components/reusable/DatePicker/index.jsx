import React from 'react';
import PropTypes from 'prop-types';
import datepicker from 'js-datepicker';
import './style.scss';

export default class DatePicker extends React.Component {
  inputRef = React.createRef();

  componentDidMount() {
    this.picker = datepicker(this.inputRef.current, {
      onSelect: this.onChange,
      dateSelected: this.props.value ? new Date(this.props.value) : new Date(),
    });
  }

  componentWillUnmount() {
    this.picker.remove();
  }

  onChange = inst => {
    this.props.onChange(inst.dateSelected, this.props.id);
  };

  render() {
    return <input type="text" ref={this.inputRef} />;
  }
}

DatePicker.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
};
