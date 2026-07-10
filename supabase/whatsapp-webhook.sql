-- Enable the pg_net extension so the database can make HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Set up Webhooks (Database Triggers) to automatically fire the Supabase Edge Function

-- 1. Create the webhook function for Medicine Requisitions (Deliveries)
CREATE OR REPLACE FUNCTION trigger_whatsapp_delivery_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if the status has actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    PERFORM net.http_post(
      url := COALESCE(current_setting('app.settings.edge_function_url', true), 'https://vfdglckuyzbnnntmdziy.supabase.co/functions/v1') || '/whatsapp-webhook',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.settings.service_role_key', true), 'sb_publishable_6DbR0VCDo7QAcOX51cQI_A_ok2NrXzz')
      ),
      body := json_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS whatsapp_delivery_update_trigger ON medicine_requisitions;
CREATE TRIGGER whatsapp_delivery_update_trigger
  AFTER UPDATE OF status ON medicine_requisitions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_whatsapp_delivery_update();


-- 2. Create the webhook function for Visit Reports
CREATE OR REPLACE FUNCTION trigger_whatsapp_visit_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for Summary Reports
  IF NEW.resource_type = 'Summary Report' THEN
    PERFORM net.http_post(
      url := COALESCE(current_setting('app.settings.edge_function_url', true), 'https://vfdglckuyzbnnntmdziy.supabase.co/functions/v1') || '/whatsapp-webhook',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.settings.service_role_key', true), 'sb_publishable_6DbR0VCDo7QAcOX51cQI_A_ok2NrXzz')
      ),
      body := json_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW)
      )::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS whatsapp_visit_report_trigger ON resources;
CREATE TRIGGER whatsapp_visit_report_trigger
  AFTER INSERT ON resources
  FOR EACH ROW
  EXECUTE FUNCTION trigger_whatsapp_visit_report();
