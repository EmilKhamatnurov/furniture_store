CREATE SEQUENCE "public"."order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_idx" ON "orders" USING btree ("number");--> statement-breakpoint
SELECT setval('order_number_seq', (SELECT COALESCE(MAX(SUBSTRING(number FROM '\d+$')::bigint), 0) + 1 FROM orders), false);
