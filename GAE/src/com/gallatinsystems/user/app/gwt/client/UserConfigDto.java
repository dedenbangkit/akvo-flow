package com.gallatinsystems.user.app.gwt.client;

import java.io.Serializable;

/**
 * Dto for returning userConfig values to the client. Used for representing
 * things like the position of portal widgets.
 * 
 * @author Christopher Fagiani
 * 
 */
public class UserConfigDto implements Serializable {
	private static final long serialVersionUID = 4515497143926759239L;

	private String group;
	private String name;
	private String value;

	public String getGroup() {
		return group;
	}

	public void setGroup(String group) {
		this.group = group;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}

	/**
	 * equality is defined as having the same group, name AND value
	 */
	public boolean equals(Object other) {
		if (other instanceof UserConfigDto) {
			if (((UserConfigDto) other).group.equals(group)
					&& ((UserConfigDto) other).name.equals(name)
					&& ((value == null && ((UserConfigDto) other).value == null) || value
							.equals(((UserConfigDto) other).value))) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

}
