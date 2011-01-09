package com.gallatinsystems.framework.gwt.util.client;

import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.user.client.Window;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.DialogBox;
import com.google.gwt.user.client.ui.DockPanel;
import com.google.gwt.user.client.ui.HTML;
import com.google.gwt.user.client.ui.PopupPanel;

/**
 * simple utility class for showing a message dialog in GWT that consists of a
 * header and a body that is html
 * 
 * @author Christopher Fagiani
 * 
 */
public class MessageDialog extends DialogBox {

	public MessageDialog(String title, String bodyHtml, boolean suppressButton) {
		setText(title);
		DockPanel dock = new DockPanel();
		HTML content = new HTML(bodyHtml);

		dock.add(content, DockPanel.CENTER);
		if (!suppressButton) {
			Button ok = new Button("OK");

			ok.addClickHandler(new ClickHandler() {
				public void onClick(ClickEvent event) {
					MessageDialog.this.hide();
				}
			});
			dock.add(ok, DockPanel.SOUTH);
		}
		setWidget(dock);
	}

	public MessageDialog(String title, String bodyHtml) {
		this(title, bodyHtml, false);
	}

	public void showCentered() {
		setPopupPositionAndShow(new PopupPanel.PositionCallback() {
			public void setPosition(int offsetWidth, int offsetHeight) {
				int left = ((Window.getClientWidth() - offsetWidth) / 2) >> 0;
				int top = ((Window.getClientHeight() - offsetHeight) / 2) >> 0;
				setPopupPosition(left, top);
			}
		});
	}
}
