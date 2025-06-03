import requests
import unittest
import sys
from datetime import datetime

class MasjidManagementAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_member_id = None
        self.test_payment_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.status_code != 204:  # No content
                    try:
                        return success, response.json()
                    except:
                        return success, {}
                return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"Error details: {error_detail}")
                except:
                    print(f"Response text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "api",
            200
        )
        if success:
            print(f"API Message: {response.get('message', '')}")
        return success

    def test_prayer_times(self):
        """Test prayer times endpoint"""
        success, response = self.run_test(
            "Prayer Times",
            "GET",
            "api/prayer-times",
            200
        )
        if success:
            print(f"Prayer Times for {response.get('date', '')}:")
            print(f"Hijri Date: {response.get('hijri_date', '')}")
            print(f"Fajr: {response.get('fajr', '')}")
            print(f"Dhuhr: {response.get('dhuhr', '')}")
            print(f"Asr: {response.get('asr', '')}")
            print(f"Maghrib: {response.get('maghrib', '')}")
            print(f"Isha: {response.get('isha', '')}")
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        success, response = self.run_test(
            "Dashboard Statistics",
            "GET",
            "api/dashboard/stats",
            200
        )
        if success:
            print(f"Total Members: {response.get('total_members', 0)}")
            print(f"Committee Members: {response.get('committee_members', 0)}")
            print(f"Monthly Collections: ₹{response.get('monthly_collections', 0)}")
            recent_payments = response.get('recent_payments', [])
            print(f"Recent Payments: {len(recent_payments)} entries")
        return success

    def test_create_member(self, is_committee=False):
        """Test creating a new member"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        member_data = {
            "name": f"Test Member {timestamp}",
            "phone": f"9876543210",
            "email": f"test{timestamp}@example.com",
            "address": "123 Test Street, Test City",
            "id_proof_type": "Aadhar",
            "id_proof_number": f"AADHAR{timestamp}",
            "is_committee_member": is_committee,
            "committee_position": "Secretary" if is_committee else None
        }
        
        success, response = self.run_test(
            f"Create {'Committee' if is_committee else 'Regular'} Member",
            "POST",
            "api/members",
            200,
            data=member_data
        )
        
        if success:
            self.test_member_id = response.get('id')
            account_number = response.get('account_number', '')
            print(f"Created Member ID: {self.test_member_id}")
            print(f"Account Number: {account_number}")
            
            # Verify account number format (MM + 8 chars)
            if account_number.startswith('MM') and len(account_number) == 10:
                print("✅ Account number format is correct (MM + 8 chars)")
            else:
                print("❌ Account number format is incorrect")
                success = False
        
        return success

    def test_get_members(self):
        """Test getting all members"""
        success, response = self.run_test(
            "Get All Members",
            "GET",
            "api/members",
            200
        )
        
        if success and isinstance(response, list):
            print(f"Retrieved {len(response)} members")
        
        return success

    def test_get_member(self, member_id):
        """Test getting a specific member"""
        success, response = self.run_test(
            "Get Specific Member",
            "GET",
            f"api/members/{member_id}",
            200
        )
        
        if success:
            print(f"Retrieved member: {response.get('name', '')}")
        
        return success

    def test_create_payment(self, member_id):
        """Test creating a payment"""
        payment_data = {
            "member_id": member_id,
            "amount": 500.00,
            "payment_type": "monthly_chanda",
            "transaction_id": f"TXN{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "month_year": datetime.now().strftime('%Y-%m')
        }
        
        success, response = self.run_test(
            "Create Payment",
            "POST",
            "api/payments",
            200,
            data=payment_data
        )
        
        if success:
            self.test_payment_id = response.get('id')
            receipt_number = response.get('receipt_number', '')
            print(f"Created Payment ID: {self.test_payment_id}")
            print(f"Receipt Number: {receipt_number}")
            
            # Verify receipt number format (RCP + date + 6 chars)
            if receipt_number.startswith('RCP') and len(receipt_number) >= 15:
                print("✅ Receipt number format is correct (RCP + date + 6 chars)")
            else:
                print("❌ Receipt number format is incorrect")
                success = False
        
        return success

    def test_get_payments(self):
        """Test getting all payments"""
        success, response = self.run_test(
            "Get All Payments",
            "GET",
            "api/payments",
            200
        )
        
        if success and isinstance(response, list):
            print(f"Retrieved {len(response)} payments")
        
        return success

    def test_get_member_payments(self, member_id):
        """Test getting payments for a specific member"""
        success, response = self.run_test(
            "Get Member Payments",
            "GET",
            f"api/payments/member/{member_id}",
            200
        )
        
        if success and isinstance(response, list):
            print(f"Retrieved {len(response)} payments for member")
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Masjid Management System API Tests")
        print("=============================================")
        
        # Basic connectivity tests
        self.test_api_root()
        self.test_prayer_times()
        self.test_dashboard_stats()
        
        # Member management tests
        regular_member_created = self.test_create_member(is_committee=False)
        if regular_member_created and self.test_member_id:
            self.test_get_members()
            self.test_get_member(self.test_member_id)
            
            # Payment tests
            payment_created = self.test_create_payment(self.test_member_id)
            if payment_created:
                self.test_get_payments()
                self.test_get_member_payments(self.test_member_id)
        
        # Committee member test
        self.test_create_member(is_committee=True)
        
        # Print test results
        print("\n=============================================")
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        print("=============================================")
        
        return self.tests_passed == self.tests_run

def main():
    # Get the backend URL from the frontend .env file
    backend_url = "https://aecb0d4d-8412-489f-8aed-c88f5fccd6ca.preview.emergentagent.com"
    
    # Setup tester
    tester = MasjidManagementAPITester(backend_url)
    
    # Run all tests
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())