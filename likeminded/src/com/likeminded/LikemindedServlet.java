package com.likeminded;

import java.io.IOException;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.GeoPt;
import com.google.appengine.api.datastore.Query;
import com.google.gson.Gson;
import com.twilio.sdk.TwilioRestClient;
import com.twilio.sdk.client.TwilioCapability;
import com.twilio.sdk.resource.factory.SmsFactory;
import com.twilio.sdk.resource.instance.Account;
import com.twilio.sdk.resource.instance.Sms;

@SuppressWarnings("serial")
public class LikemindedServlet extends HttpServlet
{
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException 
	{
		
		try
		{
			resp.setContentType("text/plain");
			
			DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
			
			String id = req.getParameter("id");
			Entity usr = new Entity("UserLocation", id);
			usr.setProperty("name", req.getParameter("name"));
			String klout = req.getParameter("klout");
			usr.setProperty("klout", Integer.getInteger(klout==null?"0":klout));
			String lt = req.getParameter("latitude");
			String lg = req.getParameter("longitude");
			GeoPt pt = new GeoPt(Float.parseFloat(lt), Float.parseFloat(lg));
			usr.setProperty("location", pt);
			usr.setProperty("login", new Date());
			String[] intrs = req.getParameterValues("interest");
			if(intrs == null)
				intrs = req.getParameterValues("interest[]");
			usr.setProperty("interest", Arrays.asList(intrs));
			datastore.put(usr);
			
			Query q = new Query("UserLocation").addSort("location");
			q.addFilter("interest", Query.FilterOperator.EQUAL, req.getParameter("selected"));
			List<Entity> results = datastore.prepare(q).asList(FetchOptions.Builder.withLimit(100));
			Gson gson = new Gson();
			resp.getWriter().println("{");
			for(Entity en : results)
				resp.getWriter().println("\""+en.getKey().getName()+"\" : "+gson.toJson(en.getProperties())+", ");
			TwilioCapability capability = new TwilioCapability("ACff31a52471134c6a107fe5a66d502a45", "d22731992b590bd471d4cb5abde860e4");
	        capability.allowClientOutgoing("AP7d9490c1c95433e080ea8955a92d4657");
			resp.getWriter().println("\"token\":\""+capability.generateToken()+"\"}");
		}
		catch(Exception ex)
		{
			throw new IOException(ex);
		}
	}
	
	public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException 
	{
		try
		{
			resp.setContentType("text/plain");
			//TwilioCapability capability = new TwilioCapability("ACff31a52471134c6a107fe5a66d502a45", "d22731992b590bd471d4cb5abde860e4");
	        //capability.allowClientOutgoing("AP7d9490c1c95433e080ea8955a92d4657");
			TwilioRestClient client = new TwilioRestClient("ACff31a52471134c6a107fe5a66d502a45", "d22731992b590bd471d4cb5abde860e4");

		    Map<String, String> params = new HashMap<String, String>();
		    params.put("Body", "Hey! I came around. Want to meetup?");
		    String to = req.getParameter("to");
		    params.put("To", to==null?"+16503532377":to);
		    params.put("From", "+19252160254");
		    
		    Account account = client.getAccount();
	        SmsFactory smsFactory = account.getSmsFactory();
		    Sms message = smsFactory.create(params);
			resp.getWriter().println("{success:'"+message.getSid()+"'}");
		}
		catch(Exception ex)
		{
			throw new IOException(ex);
		}
	}
}
