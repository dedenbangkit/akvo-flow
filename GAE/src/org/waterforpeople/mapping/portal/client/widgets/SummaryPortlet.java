package org.waterforpeople.mapping.portal.client.widgets;

import org.waterforpeople.mapping.app.gwt.client.device.DeviceDto;
import org.waterforpeople.mapping.app.gwt.client.device.DeviceService;
import org.waterforpeople.mapping.app.gwt.client.device.DeviceServiceAsync;
import org.waterforpeople.mapping.app.gwt.client.survey.SurveyDto;
import org.waterforpeople.mapping.app.gwt.client.survey.SurveyService;
import org.waterforpeople.mapping.app.gwt.client.survey.SurveyServiceAsync;
import org.waterforpeople.mapping.app.gwt.client.user.UserDto;
import org.waterforpeople.mapping.app.gwt.client.user.UserService;
import org.waterforpeople.mapping.app.gwt.client.user.UserServiceAsync;

import com.gallatinsystems.framework.gwt.portlet.client.Portlet;
import com.gallatinsystems.framework.gwt.portlet.client.PortletEvent;
import com.google.gwt.core.client.GWT;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.user.client.Window;
import com.google.gwt.user.client.rpc.AsyncCallback;
import com.google.gwt.user.client.ui.HorizontalPanel;
import com.google.gwt.user.client.ui.Image;
import com.google.gwt.user.client.ui.Label;
import com.google.gwt.user.client.ui.Tree;
import com.google.gwt.user.client.ui.TreeItem;

/**
 * Displays summary information
 * 
 * @author Christopher Fagiani
 * 
 */
public class SummaryPortlet extends Portlet {
	public static final String DESCRIPTION = "Displays a tree allowing you to drill-down into survey, device, and user details";
	public static final String NAME = "System Summary";
	private static final int WIDTH = 300;
	private static final int HEIGHT = 300;
	private static final String TREE_ITEM_HEIGHT = "25";
	private static final String USER_IMAGE = "images/users.png";
	private static final String GOOGLE_EARTH_IMAGE = "images/google_earth_icon.png";
	private static final String SURVEY_IMAGE = "images/surveys.png";
	private static final String DEVICE_IMAGE = "images/device.png";
	private TreeItem surveyRoot;
	private TreeItem deviceRoot;
	private TreeItem userRoot;
	private TreeItem kmlRoot;
	

	public SummaryPortlet() {
		super(NAME, true, false, WIDTH, HEIGHT);
		SurveyServiceAsync surveyService = GWT.create(SurveyService.class);
		// Set up the callback object.
		AsyncCallback<SurveyDto[]> surveyCallback = new AsyncCallback<SurveyDto[]>() {
			public void onFailure(Throwable caught) {
				// no-op
			}

			public void onSuccess(SurveyDto[] result) {
				if (result != null) {
					for (int i = 0; i < result.length; i++) {
						surveyRoot.addItem(result[i].getName() + " - v."
								+ result[i].getVersion());
					}
				}
			}
		};
		surveyService.listSurvey(surveyCallback);

		DeviceServiceAsync deviceService = GWT.create(DeviceService.class);
		// Set up the callback object.
		AsyncCallback<DeviceDto[]> deviceCallback = new AsyncCallback<DeviceDto[]>() {
			public void onFailure(Throwable caught) {
				// no-op
			}

			public void onSuccess(DeviceDto[] result) {
				if (result != null) {
					for (int i = 0; i < result.length; i++) {
						deviceRoot.addItem(result[i].getPhoneNumber());
					}
				}
			}	
		};
		deviceService.listDevice(deviceCallback);

		UserServiceAsync userService = GWT.create(UserService.class);
		// Set up the callback object.
		AsyncCallback<UserDto[]> userCallback = new AsyncCallback<UserDto[]>() {
			public void onFailure(Throwable caught) {
				// no-op
			}

			public void onSuccess(UserDto[] result) {
				if (result != null) {
					for (int i = 0; i < result.length; i++) {
						if (result[i].getUserName() != null) {
							userRoot.addItem(result[i].getUserName());
						} else {
							userRoot.addItem(result[i].getEmailAddress());
						}
					}
				}
			}
		};
		userService.listUser(userCallback);

		setContent(constructTree());

	}

	private Tree constructTree() {
		Tree t = new Tree();
		HorizontalPanel panel = new HorizontalPanel();
		panel.setHeight(TREE_ITEM_HEIGHT);
		panel.add(new Image(SURVEY_IMAGE));
		panel.add(new Label("Surveys"));
		surveyRoot = t.addItem(panel);

		panel = new HorizontalPanel();
		panel.setHeight(TREE_ITEM_HEIGHT);
		panel.add(new Image(USER_IMAGE));
		panel.add(new Label("Users"));
		userRoot = t.addItem(panel);
		

		panel = new HorizontalPanel();
		panel.setHeight(TREE_ITEM_HEIGHT);
		panel.add(new Image(DEVICE_IMAGE));
		panel.add(new Label("Devices"));
		deviceRoot = t.addItem(panel);
		
		panel = new HorizontalPanel();
		panel.setHeight(TREE_ITEM_HEIGHT);
		panel.add(new Image(GOOGLE_EARTH_IMAGE));
		Label l = new Label("View Current Map");
		l.addClickHandler(new ClickHandler() {
			
			@Override
			public void onClick(ClickEvent event) {
				Window.open("/webapp/waterforpeoplemappinggoogle?showKML=true", "KMZ", null);
			}
		});
		panel.add(l);
		kmlRoot = t.addItem(panel);
	
		return t;
	}

	@Override
	public void handleEvent(PortletEvent e) {
		// no-op
	}

	@Override
	protected boolean getReadyForRemove() {
		// no-op. nothing to do before remove
		return true;
	}

	@Override
	protected void handleConfigClick() {
		// no-op. this portlet does not support config
	}

	public String getName(){
		return NAME;
	}

}
