-- Enable RLS on all tables (deny-all by default when no policies exist)

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "car_models" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "generations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vehicle_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rental_contracts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lease_contracts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inquiries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "residual_value_rates" ENABLE ROW LEVEL SECURITY;

-- Profile sync trigger: auto-create profile when a new auth.users row is inserted

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."profiles" (id, email, role)
  VALUES (new.id, new.email, 'CUSTOMER');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
