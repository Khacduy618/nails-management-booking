
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  services,
  serviceCategories,
  staff,
  staffServices,
} from "@/db/schema";
import { decrypt } from "@/lib/crypto";

export type PublicService = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  popular: boolean;
  category: string | null;
};

export type PublicStaff = {
  id: number;
  name: string;
  position: string | null;
  specialties: unknown;
  experience: string | null;
  rating: number;
  serviceIds: number[];
};

function publicName(value: string | null | undefined): string {
  if (!value) return "Nhân viên";

  // Tên có thể được mã hóa trong bảng users.
  if (value.startsWith("v1:")) {
    return decrypt(value) || "Nhân viên";
  }

  return value;
}

export async function getActiveServices(): Promise<PublicService[]> {
  const rows = await db.query.services.findMany({
    where: eq(services.status, "active"),
    with: {
      category: {
        columns: {
          name: true,
          status: true,
        },
      },
    },
    orderBy: [services.name],
  });

  return rows
    .filter((service) =>
      !service.category || service.category.status === "active"
    )
    .map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      price: Number(service.price),
      duration: service.duration,
      popular: Boolean(service.popular),
      category: service.category?.name ?? null,
    }));
}

export async function getActiveStaffForService(
  serviceIds: number[] = [],
): Promise<PublicStaff[]> {
  const activeStaff = await db.query.staff.findMany({
    where: eq(staff.status, "active"),
    with: {
      user: {
        columns: {
          name: true,
        },
      },
      staffServices: {
        columns: {
          serviceId: true,
        },
      },
    },
    orderBy: [staff.id],
  });

  return activeStaff
    .map((member) => {
      const serviceIdsForStaff = member.staffServices.map(
        (item) => item.serviceId,
      );

      return {
        id: member.id,
        name: publicName(member.user?.name),
        position: member.position,
        specialties: member.specialties,
        experience: member.experience,
        rating: Number(member.rating ?? 0),
        serviceIds: serviceIdsForStaff,
      };
    })
    .filter((member) =>
      serviceIds.length === 0 ||
      serviceIds.every((id) => member.serviceIds.includes(id))
    );
}

export async function getPublicBusinessContext() {
  const [activeServices, activeStaff] = await Promise.all([
    getActiveServices(),
    getActiveStaffForService(),
  ]);

  return {
    services: activeServices,
    staff: activeStaff,
    limitations: [
      "Không có bảng chi nhánh trong schema hiện tại.",
      "Không tự suy đoán địa chỉ, giờ mở cửa hoặc chương trình khuyến mãi.",
      "Giá và thời lượng dịch vụ phải lấy từ database.",
    ],
  };
}
