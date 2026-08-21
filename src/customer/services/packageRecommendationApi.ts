import { getCarPackages, type CarPackage } from '../../admin/services/packagesApi';

export async function getApprovedPackagesForVehicle(carId?: string | null): Promise<CarPackage[]> {
  const packages = await getCarPackages();
  return (packages || [])
    .filter((pkg) => pkg.is_active !== false)
    .filter((pkg) => !carId || !pkg.car_id || pkg.car_id === carId);
}
